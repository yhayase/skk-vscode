import { Candidate } from "./candidate";
import { Entry } from "./entry";

/**
 * Interface for a jisyo (dictionary) provider.
 */
export interface IJisyoProvider {
    /**
     * Lookup candidates for a given key
     * @param key The dictionary key to look up
     * @returns Array of candidates or undefined if none found
     */
    lookupCandidates(key: string): Promise<Entry | undefined>;

    /**
     * Register a new candidate for a given key
     * @param key The key to register the candidate under
     * @param candidate The candidate to register
     * @returns True if registration was successful
     */
    registerCandidate(key: string, candidate: Candidate): Promise<boolean>;

    /**
     * Reorder candidates for a key by moving a candidate at a specific index to the front
     * @param key The key whose candidates should be reordered
     * @param selectedIndex The index of the selected candidate that should be moved to front
     * @returns True if reordering was successful
     */
    reorderCandidate(key: string, selectedIndex: number): Promise<boolean>;

    /**
     * Delete a candidate from the dictionary
     * @param key The key of the candidate
     * @param candidate The candidate to delete
     * @returns True if deletion was successful
     */
    deleteCandidate(key: string, candidate: Candidate): Promise<boolean>;
}