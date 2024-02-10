import { Uri } from "vscode";
import * as vscode from 'vscode';
import { Candidate } from "./candidate";
import { CompositeMap } from "../lib/composite-map";

type Jisyo = Map<string, Candidate[]>;

const userJisyoKey = "skk-vscode.user-jisyo";

var globalJisyo: Jisyo;

export async function init(memento: vscode.Memento): Promise<void> {
    let systemJisyo = await loadSystemJisyoFromUri(memento, Uri.parse("https://raw.githubusercontent.com/skk-dev/dict/master/SKK-JISYO.L"));
    let userJisyo = loadOrInitUserJisyo(memento);
    globalJisyo = new CompositeJisyo([userJisyo, systemJisyo], memento);
}

export function getGlobalJisyo(): Jisyo {
    return globalJisyo;
}

class CompositeJisyo extends CompositeMap<string, Candidate[]> {
    private memento: vscode.Memento;

    constructor(jisyoList: Jisyo[], memento: vscode.Memento) {
        super(jisyoList);
        this.memento = memento;
    }

    set(key: string, value: Candidate[]): this {
        super.set(key, value);
        saveUserJisyo(this.memento, this.maps[0]);
        return this;
    }
}

function loadOrInitUserJisyo(memento: vscode.Memento): Jisyo {
    // check if local cache is available
    const cache = memento.get<Object>(userJisyoKey);
    const now = Date.now();
    if (cache) {
        return new Map(Object.entries(cache));
    }
    
    return new Map();
}

async function saveUserJisyo(memento: vscode.Memento, userJisyo: Jisyo): Promise<void> {
    await memento.update(userJisyoKey, Object.fromEntries(userJisyo));
}


async function loadSystemJisyoFromUri(memento: vscode.Memento, uri: Uri): Promise<Jisyo> {
    const systemJisyoKey = "skk-vscode.jisyo";
    const cacheExpiryKey = "skk-vscode.jisyo-expiry";

    // check if local cache is available
    const cache = memento.get<Object>(systemJisyoKey);
    const cacheExpiry = memento.get<number>(cacheExpiryKey);
    const now = Date.now();
    if (cache && cacheExpiry && now < cacheExpiry) {
        return new Map(Object.entries(cache));
    }

    // clear cache
    await memento.update(systemJisyoKey, undefined);
    await memento.update(cacheExpiryKey, undefined);

    // download jisyo from uri
    const response = await fetch(uri.toString());
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rawJisyo = Buffer.from(await response.arrayBuffer());

    const jisyo = rawSKKJisyoToJisyo(rawJisyo);
    await memento.update(systemJisyoKey, Object.fromEntries(jisyo));
    await memento.update(cacheExpiryKey, now + 1000 * 60 * 60 * 24 * 30); // 30 days
    return jisyo;
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