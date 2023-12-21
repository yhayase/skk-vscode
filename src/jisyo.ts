import { Uri } from "vscode";
import * as vscode from 'vscode';

export class JisyoCandidate {
    word: string;
    annotation?: string;

    constructor(word: string, annotation?: string) {
        this.word = word;
        this.annotation = annotation;
    }
};

type Jisyo = Map<string, JisyoCandidate[]>;

var globalJisyo: Jisyo;

export async function init(memento: vscode.Memento): Promise<void> {
    globalJisyo = await loadJisyoFromUri(memento, Uri.parse("https://raw.githubusercontent.com/skk-dev/dict/master/SKK-JISYO.L"));
}

export function getGlobalJisyo(): Jisyo {
    return globalJisyo;
}

async function loadJisyoFromUri(memento: vscode.Memento, uri: Uri): Promise<Jisyo> {
    const cacheKey = "skk-vscode.jisyo";
    const cacheExpiryKey = "skk-vscode.jisyo-expiry";

    // check if local cache is available
    const cache = memento.get<Object>(cacheKey);
    const cacheExpiry = memento.get<number>(cacheExpiryKey);
    const now = Date.now();
    if (cache && cacheExpiry && now < cacheExpiry) {
        return new Map(Object.entries(cache));
    }

    // clear cache
    await memento.update(cacheKey, undefined);
    await memento.update(cacheExpiryKey, undefined);

    // download jisyo from uri
    const response = await fetch(uri.toString());
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rawJisyo = Buffer.from(await response.arrayBuffer());

    const jisyo = rawSKKJisyoToJisyo(rawJisyo);
    await memento.update(cacheKey, Object.fromEntries(jisyo));
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

        const candidateList: JisyoCandidate[] = [];
        candidates.split("/").forEach((candidateStr) => {
            const [candidate, annotation] = candidateStr.split(";", 2);
            if (candidate === undefined || candidate === "") {
                // Skip empty candidate
                return;
            }
            candidateList.push(new JisyoCandidate(candidate, annotation));
        });

        if (jisyo.has(word)) {
            jisyo.get(word)?.push(...candidateList);
        } else {
            jisyo.set(word, candidateList);
        }
    }
    return jisyo;
}

