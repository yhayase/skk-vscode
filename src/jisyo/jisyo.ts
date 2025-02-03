import { Uri } from "vscode";
import * as vscode from 'vscode';
import { Candidate } from "./candidate";
import { CompositeMap } from "../lib/composite-map";

type Jisyo = Map<string, Candidate[]>;

const userJisyoKey = "skk.user-jisyo";

var globalJisyo: CompositeJisyo;

export async function init(memento: vscode.Memento): Promise<void> {
    const cfg = vscode.workspace.getConfiguration("skk");
    const dictUrls = cfg.get<string[]>("dictUrls", ["https://raw.githubusercontent.com/skk-dev/dict/master/SKK-JISYO.L"]);
    const systemJisyos = await loadAllSystemJisyos(memento, dictUrls);
    const userJisyo = loadOrInitUserJisyo(memento);
    globalJisyo = new CompositeJisyo([userJisyo, ...systemJisyos], memento);
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
        saveUserJisyo(this.memento, this.maps[0]);
        return this;
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
        saveUserJisyo(this.memento, this.maps[0]);
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
        saveUserJisyo(this.memento, this.maps[0]);
        return true;
    }
}

function loadOrInitUserJisyo(memento: vscode.Memento): Jisyo {
    // check if local cache is available
    const cache = memento.get<Object>(userJisyoKey);
    if (cache) {
        return new Map(Object.entries(cache));
    }
    
    return new Map();
}

async function saveUserJisyo(memento: vscode.Memento, userJisyo: Jisyo): Promise<void> {
    await memento.update(userJisyoKey, Object.fromEntries(userJisyo));
}

async function loadAllSystemJisyos(memento: vscode.Memento, urls: string[]): Promise<Jisyo[]> {
    const savedCache = memento.get<Record<string, object>>("skk.jisyoCache") || {};
    const savedExpiries = memento.get<Record<string, number>>("skk.jisyoCacheExpiries") || {};
    const now = Date.now();

    // Expire old or unused caches from savedCache and savedExpiries to prevent memory leak
    for (const url in savedExpiries) {
        if (savedExpiries[url] < now || !urls.includes(url)) {
            delete savedCache[url];
            delete savedExpiries[url];
        }
    }
    // the remaining caches are valid

    const promises = urls.map(async (url) => {
        const cached = savedCache[url];
        if (cached) {
            return new Map(Object.entries(cached));
        }
        
        // Cache not found, fetch from the internet
        const jisyo = await fetchAndDecodeDictionary(url);
        savedCache[url] = Object.fromEntries(jisyo);
        savedExpiries[url] = now + 1000 * 60 * 60 * 24 * 30; // 30 days
        return jisyo;
    });

    const results = await Promise.all(promises);
    memento.update("skk.jisyoCache", savedCache); // execute asynchronously
    memento.update("skk.jisyoCacheExpiries", savedExpiries); // execute asynchronously
    return results;
}

async function fetchAndDecodeDictionary(url: string): Promise<Jisyo> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rawJisyo = Buffer.from(await response.arrayBuffer());
    return rawSKKJisyoToJisyo(rawJisyo);
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