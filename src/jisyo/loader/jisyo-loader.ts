import * as vscode from 'vscode';
import { Candidate } from '../candidate';
import { Jisyo } from '../types';
import { JisyoCache } from '../cache/jisyo-cache';

export class JisyoLoader {
    private cache: JisyoCache;

    constructor(storageUri: vscode.Uri) {
        this.cache = new JisyoCache(storageUri);
    }

    /**
     * Initialize the loader
     */
    async init(): Promise<void> {
        await this.cache.init();
    }

    /**
     * Load a user dictionary from memento storage
     */
    loadUserJisyo(memento: vscode.Memento): Jisyo {
        const USER_JISYO_KEY = "skk.user-jisyo";
        const cache = memento.get<Object>(USER_JISYO_KEY);
        if (cache) {
            return new Map(Object.entries(cache));
        }
        return new Map();
    }

    /**
     * Load all system dictionaries from URLs
     */
    async loadSystemJisyos(urls: string[]): Promise<Jisyo[]> {
        // Clean up unused cache files first
        await this.cache.cleanUnusedCache(urls);

        // Load each dictionary
        const promises = urls.map(async (url) => {
            let rawJisyo = await this.cache.tryReadFromCache(url);
            
            if (!rawJisyo) {
                // Cache miss - fetch from network
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                rawJisyo = Buffer.from(await response.arrayBuffer());
                
                // Save to cache asynchronously
                this.cache.saveToCache(url, rawJisyo);
            }

            return this.parseRawJisyo(rawJisyo);
        });

        return Promise.all(promises);
    }

    /**
     * Parse raw SKK dictionary data into a Jisyo object
     */
    private parseRawJisyo(rawLines: Buffer): Jisyo {
        const jisyo: Jisyo = new Map();
        const eucJpDecoder = new TextDecoder('euc-jp');
        const lines = eucJpDecoder.decode(rawLines).split("\n");

        for (const line of lines) {
            if (line.startsWith(";;")) {
                continue; // Skip comments
            }

            const [word, candidates] = line.split(" /", 2);
            if (!word || !candidates) {
                continue; // Skip malformed lines
            }

            const candidateList: Candidate[] = [];
            candidates.split("/").forEach((candidateStr) => {
                const [candidate, annotation] = candidateStr.split(";", 2);
                if (!candidate) {
                    return; // Skip empty candidates
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
}