import { Candidate } from "../jisyo/candidate";

export enum DeleteLeftResult {
    markerDeleted,
    otherCharacterDeleted,
    markerNotFoundAndOtherCharacterDeleted,
    noEditor
}

export interface IEditor {
    /**
     * Basically, delete the character just before the cursor.
     * If the cursor is at the position just after the midashigo start marker, and the character is "▽",
     * delete the marker and notify the caller.
     * If the cursor is at the position just after the midashigo start marker, and the character is not "▽",
     * delete the character and notify the caller.
     */
    deleteLeft(): DeleteLeftResult;

    /**
     * Fixate the candidate shown over the midashigo.
     *
     * This method fixate the range from "▼" to the cursor position, then hide the annotation.
     */
    fixateCandidate(candStr: string | undefined): PromiseLike<boolean>;
    clearCandidate(): PromiseLike<boolean | void>;

    /**
     * Show henkan candidates over the midashigo.
     * @param candidate The candidate to show
     * @returns Promise that resolves to true if the candidate is shown, false otherwise
     */
    showCandidate(candidate: Candidate | undefined): PromiseLike<boolean | void>;

    /**
     * Change character type according to the first character of the midashigo
     * and fixate the midashigo.
     * In case of the first character is
     * - hiragana, convert all appearing hiragana to katakana,
     * - katakana, convert all appearing katakana to hiragana,
     * - ascii, convert all appearing ascii to full-width ascii.
     * - full-width ascii, convert all appearing full-width ascii to ascii.
     * @returns void
     */
    toggleCharTypeInMidashigoAndFixateMidashigo(): void;
    clearMidashigo(): PromiseLike<boolean>;

    /**
     * Extract text from the midashigo start marker to the cursor position without heading marker "▽".
     * @returns extracted text.  If any inconsistency found, returns undefined.
     */
    extractMidashigo(): string | undefined;

    /**
     * Calculate the range of the midashigo, which is started by "▽" and ended by the cursor position.
     * @param editor active text editor
     * @returns Range of the midashigo.  If any inconsistency found, returns undefined.
     */
    calcMidashigoRange(): any | undefined;

    /**
     * Fixate the unconversioned midashigo.
     */
    fixateMidashigo(): PromiseLike<boolean>;
    setMidashigoStartToCurrentPosition(): void;
    hideCandidateList(): void;
    showCandidateList(candidateList: Candidate[], alphabetList: string[]): void;
    showRemainingRomaji(remainingRomaji: string, isOkuri: boolean, offset: number): void;

}