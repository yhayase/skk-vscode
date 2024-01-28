import { assert } from "console";
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
type CompositeJisyo = CompositeMap<string, JisyoCandidate[]>;

var userJisyo: Jisyo;
var systemJisyo: Jisyo;
var globalJisyo: CompositeJisyo;

export async function init(memento: vscode.Memento): Promise<void> {
    systemJisyo = await loadJisyoFromUri(memento, Uri.parse("https://raw.githubusercontent.com/skk-dev/dict/master/SKK-JISYO.L"));
    userJisyo = new Map(); // await loadOrInitUserJisyo(memento);
    globalJisyo = new CompositeMap([userJisyo, systemJisyo]);
}

export function getGlobalJisyo(): CompositeJisyo {
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

class CompositeMap<K, V> implements Map<K, V> {
    private maps: Map<K, V>[] = [];

    constructor(maps: Map<K, V>[]) {
        assert(maps.length > 0);
        this.maps = maps;
    }

    /**
     * Return the value from the first map that has the key.
     * @param key 
     * @returns 
     */
    get(key: K): V | undefined {
        for (const map of this.maps) {
            if (map.has(key)) {
                return map.get(key);
            }
        }
        return undefined;
    }

    /**
     * Set the value for the given key in the first map.
     * @param key 
     * @param value 
     * @returns 
     */
    set(key: K, value: V): this {
        this.maps[0].set(key, value);
        return this;
    }

    /**
     * Does not support this operation.
     * @param key 
     * @returns 
     */
    clear(): void {
        throw new Error("Method not implemented.");
    }
    /**
     * Does not support this operation.
     * @param key 
     * @returns 
     */
    delete(key: K): boolean {
        throw new Error("Method not implemented.");
    }

    /**
     * Delete the key from the first map.
     */
    deleteFromFirst(key: K): boolean {
        return this.maps[0].delete(key);
    }

    /**
     * Iterates over the all pairs of key and value.
     * Only the first pair in the maps is processed.
     * @param callbackfn 
     * @param thisArg 
     * @returns 
     */
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        for (let entry of this.entries()) {
            // treat thisArg as "this" in callbackfn
            if (thisArg === undefined) {
                callbackfn(entry[1], entry[0], this);
            } else {
                callbackfn.apply(thisArg, [entry[1], entry[0], this]);
            }
        }
    }

    /**
     * Checks if the key is in the maps.
     * @param key 
     */
    has(key: K): boolean {
        for (const map of this.maps) {
            if (map.has(key)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns iterator over the all pairs of key and value.
     */
    *entries(): IterableIterator<[K, V]> {
        let seen = new Set<K>();
        for (const map of this.maps) {
            for (const [key, value] of map.entries()) {
                if (!seen.has(key)) {
                    yield [key, value];
                    seen.add(key);
                }
            }
        }
    }

    *keys(): IterableIterator<K> {
        for (let entry of this.entries()) {
            yield entry[0];
        }
    }

    *values(): IterableIterator<V> {
        for (let entry of this.entries()) {
            yield entry[1];
        }
    }

    [Symbol.iterator](): IterableIterator<[K, V]> {
        return this.entries();
    }
    
    get size(): number {
        let seen = new Set<K>();
        for (const map of this.maps) {
            for (const key of map.keys()) {
                if (!seen.has(key)) {
                    seen.add(key);
                }
            }
        }
        return seen.size;
    }

    /**
     * Returns "[object MultiMap]".
     */
    get [Symbol.toStringTag](): string {
        return "[object MultiMap]";
    }
}