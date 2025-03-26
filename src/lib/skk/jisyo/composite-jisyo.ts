import * as vscode from 'vscode';
import { CompositeMap } from "../../../lib/composite-map";
import { Candidate } from "./candidate";
import { Jisyo } from "../../../lib/skk/jisyo/types";

const USER_JISYO_KEY = "skk.user-jisyo";

export class CompositeJisyo extends CompositeMap<string, Candidate[]> {
    private memento: vscode.Memento;

    constructor(jisyoList: Jisyo[], memento: vscode.Memento) {
        super(jisyoList);
        this.memento = memento;
    }

    /**
     * Register a new Midashigo to the user dictionary.
     * @param key - The midashigo to register
     * @param value - The list of candidates
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
     * @param key - The key to delete
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
     * @param key - The key of the candidate
     * @param candidate - The candidate to delete
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
     * @param key - The key to register
     * @param candidate - The candidate to add
     * @param save - Whether to save the dictionary immediately
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