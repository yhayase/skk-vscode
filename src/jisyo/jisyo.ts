import * as vscode from 'vscode';
import * as path from 'path';
import { brotliCompress, brotliDecompress } from 'zlib';
import { promisify } from 'util';
import { Candidate } from "./candidate";
import { CompositeMap } from "../lib/composite-map";

const compress = promisify(brotliCompress);
const decompress = promisify(brotliDecompress);

type Jisyo = Map<string, Candidate[]>;
type CacheMetadata = { expiry: number };

const USER_JISYO_KEY = "skk.user-jisyo";
const CACHE_EXPIRY_DAYS = 30;
const CACHE_DIRECTORY = ["cache", "jisyo"];

var globalJisyo: CompositeJisyo;

export async function init(memento: vscode.Memento, storageUri: vscode.Uri): Promise<void> {
    const cfg = vscode.workspace.getConfiguration("skk");
    const dictUrls = cfg.get<string[]>("dictUrls", ["https://raw.githubusercontent.com/skk-dev/dict/master/SKK-JISYO.L"]);
    const systemJisyos = await loadAllSystemJisyos(memento, storageUri, dictUrls);
    const userJisyo = loadOrInitUserJisyo(memento);
    globalJisyo = new CompositeJisyo([userJisyo, ...systemJisyos], memento);
    cleanUpOldMementoKeys(memento);
}

// Remove old memento keys such like skk.jisyoCache and skk.jisyoCacheExpiries
async function cleanUpOldMementoKeys(memento: vscode.Memento) {
    const activeMementoKeys = [USER_JISYO_KEY];
    memento.keys().filter((key) => !activeMementoKeys.includes(key)).forEach((key) => {
        memento.update(key, undefined);
    });
}

export function getGlobalJisyo(): CompositeJisyo {
    return globalJisyo;
}

class CompositeJisyo extends CompositeMap<string, Candidate[]> {
    private memento: vscode.Memento;

    constructor(jisyoList: Jisyo[], memento: vscode.Memento) {
        super(jisyoList);
        this.memento = memento;
    }

    /**
     * Register a new Midashigo to the user dictionary.
     * @param key 
     * @param value 
     * @returns 
     */
    set(key: string, value: Candidate[]): this {
        super.set(key, value);
        this.saveUserJisyo();
        return this;
    }

    /**
     * Retrieve a list of candidates for the given key.
     * This method searches through all Jisyos, combines the results, and removes any duplicates.
     * @param key The key to search for.
     * @returns A list of candidates, or undefined if no candidates are found.
     */
    get(key: string): Candidate[] | undefined {
        const candidateList = this.maps.map((jisyo) => jisyo.get(key) || []).flat(1);
        if (candidateList.length === 0) {
            return undefined;
        }

        // Remove duplicate candidates
        const seenWords = new Set<string>();
        return candidateList.filter((c) => {
            const duplicate = seenWords.has(c.word);
            seenWords.add(c.word);
            return !duplicate;
        });
    }

    /**
     * Delete a key from the user dictionary.
     * @param key 
     * @returns true if the key was found and deleted, false otherwise.
     */
    delete(key: string): boolean {
        if (!this.maps[0].has(key)) {
            return false;
        }

        const result = this.maps[0].delete(key);
        this.saveUserJisyo();
        return result;
    }

    /**
     * Delete a specified candidate from the user dictionary.
     * @param key 
     * @param candidate 
     * @returns 
     */
    deleteCandidate(key: string, candidate: Candidate): boolean {
        if (!this.maps[0].has(key)) {
            return false;
        }

        const candidateList = this.maps[0].get(key);
        if (!candidateList) {
            return false;
        }

        const newCandidateList = candidateList.filter((c) => c.word !== candidate.word);
        if (newCandidateList.length === 0) {
            this.maps[0].delete(key);
        } else {
            this.maps[0].set(key, newCandidateList);
        }
        this.saveUserJisyo();
        return true;
    }

    /**
     * Add a new candidate to the beginning of the user dictionary.
     * @param key 
     * @param candidate 
     * @returns 
     */
    registerCandidate(key: string, candidate: Candidate, save: boolean): boolean {
        const candidateList = this.maps[0].get(key) || [];
        const newCandidateList = [candidate, ...candidateList.filter((c) => c.word !== candidate.word)];
        this.maps[0].set(key, newCandidateList);
        if (save) {
            this.saveUserJisyo();
        }
        return true;
    }

    /**
     * Save the user dictionary to the Memento.
     */
    async saveUserJisyo(): Promise<void> {
        vscode.window.showInformationMessage("SKK: Saving user dictionary...");
        return this.memento.update(USER_JISYO_KEY, Object.fromEntries(this.maps[0]));
    }
}

function loadOrInitUserJisyo(memento: vscode.Memento): Jisyo {
    // check if local cache is available
    const cache = memento.get<Object>(USER_JISYO_KEY);
    if (cache) {
        return new Map(Object.entries(cache));
    }

    return new Map();
}

async function loadAllSystemJisyos(memento: vscode.Memento, storageUri: vscode.Uri, jisyoUrls: string[]): Promise<Jisyo[]> {
    const cacheUri = vscode.Uri.joinPath(storageUri, ...CACHE_DIRECTORY);

    // Ensure cache directory exists
    const fs = vscode.workspace.fs;
    // check if cache directory exists
    try {
        await fs.stat(cacheUri);
    } catch (e) {
        for (let i = 0; i <= CACHE_DIRECTORY.length; i++) {
            const slice = CACHE_DIRECTORY.slice(0, i);
            const dir = vscode.Uri.joinPath(storageUri, ...slice);
            try {
                await fs.createDirectory(dir);
            } catch (e) {
                // Directory might already exist, that's fine
            }
        }
    }

    // Delete unused cache files, which are not in the urls list
    const cacheFiles = await fs.readDirectory(cacheUri);
    cacheFiles.forEach(async ([file, type]) => {
        if (type === vscode.FileType.File) {
            const cacheFileName = path.basename(file);
            const acceptableSuffixes = [".dict.br", ".meta.json"];

            // remove file if file name does not match *.dict.br or *.meta.json
            if (!acceptableSuffixes.some(ext => cacheFileName.endsWith(ext))) {
                await fs.delete(vscode.Uri.joinPath(cacheUri, file));
                return;
            }

            const cacheKey = acceptableSuffixes.reduce((key, ext) => key.replace(ext, ''), cacheFileName);
            const url = Buffer.from(cacheKey, 'base64url').toString();
            if (!jisyoUrls.includes(url)) {
                await fs.delete(vscode.Uri.joinPath(cacheUri, file));
            }
        }
    });

    const promises = jisyoUrls.map(async (url) => {
        const cacheFileName = Buffer.from(url).toString('base64url');
        const cachePath = vscode.Uri.joinPath(cacheUri, `${cacheFileName}.dict.br`);
        const metadataPath = vscode.Uri.joinPath(cacheUri, `${cacheFileName}.meta.json`);

        try {
            // Try to read metadata
            const metadataBytes = await fs.readFile(metadataPath);
            const metadata: CacheMetadata = JSON.parse(new TextDecoder().decode(metadataBytes));

            // Check if cache is still valid
            if (metadata.expiry > Date.now()) {
                // Read and decompress cached dictionary
                const compressedData = await fs.readFile(cachePath);
                const rawJisyo = await decompress(compressedData);
                return rawSKKJisyoToJisyo(rawJisyo);
            }

            // Delete expired cache files
            await fs.delete(cachePath);
            await fs.delete(metadataPath);
        } catch (e) {
            // If any error occurs (file not found, invalid format, etc.), we'll fetch fresh data
        }

        // Cache not found or expired, fetch from the internet
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawJisyo = Buffer.from(await response.arrayBuffer());

        // Save the compressed dictionary and metadata
        const compressedData = await compress(rawJisyo);
        const metadata: CacheMetadata = {
            expiry: Date.now() + CACHE_EXPIRY_DAYS * (1000 * 60 * 60 * 24) // in milliseconds 
        };

        // Write files asynchronously - don't await as we don't need to block on this
        fs.writeFile(cachePath, compressedData);
        fs.writeFile(metadataPath, Buffer.from(JSON.stringify(metadata)));

        return rawSKKJisyoToJisyo(rawJisyo);
    });

    return Promise.all(promises);
}

function rawSKKJisyoToJisyo(rawLines: Buffer): Jisyo {
    const jisyo: Jisyo = new Map();

    const eucJpDecoder = new TextDecoder('euc-jp');
    const lines = eucJpDecoder.decode(rawLines).split("\n");
    for (const line of lines) {
        if (line.startsWith(";;")) {
            // Skip comments
            continue;
        }

        const [word, candidates] = line.split(" /", 2);
        if (word === undefined || candidates === undefined) {
            // Skip malformed or empty lines
            continue;
        }

        const candidateList: Candidate[] = [];
        candidates.split("/").forEach((candidateStr) => {
            const [candidate, annotation] = candidateStr.split(";", 2);
            if (candidate === undefined || candidate === "") {
                // Skip empty candidate
                return;
            }
            candidateList.push(new Candidate(candidate, annotation));
        });

        if (jisyo.has(word)) {
            jisyo.get(word)?.push(...candidateList);
        } else {
            jisyo.set(word, candidateList);
        }
    }
    return jisyo;
}

export function deactivate() {
    return globalJisyo.saveUserJisyo();
}
