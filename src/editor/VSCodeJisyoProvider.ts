import { Candidate } from "../jisyo/candidate";
import { Entry } from "../jisyo/entry";
import { IJisyoProvider } from "../jisyo/IJisyoProvider";
import { getGlobalJisyo } from "../jisyo/jisyo";

/**
 * Implementation of IJisyoProvider for VS Code.
 * This class serves as a bridge between the editor and the jisyo (dictionary) system.
 */
export class VSCodeJisyoProvider implements IJisyoProvider {
    /**
     * Lookup candidates for a given key from the global jisyo
     * @param key The dictionary key to look up
     * @returns Array of candidates or undefined if none found
     */
    async lookupCandidates(key: string): Promise<Entry | undefined> {
        const candidates = getGlobalJisyo().get(key);
        if (!candidates) {
            return undefined;
        }
        return new Entry(key, candidates, "");
    }

    /**
     * Register a new candidate for a given key in the global jisyo
     * @param key The key to register the candidate under
     * @param candidate The candidate to register
     * @returns True if registration was successful
     */
    async registerCandidate(key: string, candidate: Candidate): Promise<boolean> {
        return getGlobalJisyo().registerCandidate(key, candidate, true);
    }

    /**
     * Reorder candidates for a key by moving a candidate at a specific index to the front
     * @param key The key whose candidates should be reordered
     * @param selectedIndex The index of the selected candidate that should be moved to front
     * @returns True if reordering was successful
     */
    async reorderCandidate(key: string, selectedIndex: number): Promise<boolean> {
        const candidates = getGlobalJisyo().get(key);
        if (!candidates || selectedIndex >= candidates.length) {
            return false;
        }

        // Extract the selected candidate
        const selected = candidates[selectedIndex];
        
        // Create a new array with the selected candidate at the front,
        // followed by all other candidates
        const reordered = [
            selected,
            ...candidates.slice(0, selectedIndex),
            ...candidates.slice(selectedIndex + 1)
        ];

        // Update the dictionary with the reordered candidates
        getGlobalJisyo().set(key, reordered);
        return true;
    }

    /**
     * Delete a candidate from the dictionary
     * @param key The key of the candidate
     * @param candidate The candidate to delete
     * @returns True if deletion was successful
     */
    async deleteCandidate(key: string, candidate: Candidate): Promise<boolean> {
        return getGlobalJisyo().deleteCandidate(key, candidate);
    }
}