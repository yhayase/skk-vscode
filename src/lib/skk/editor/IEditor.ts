import { Candidate } from "../jisyo/candidate";
import { IInputMode } from '../input-mode/IInputMode';
import { IJisyoProvider } from '../jisyo/IJisyoProvider';

export enum DeleteLeftResult {
    markerDeleted,
    otherCharacterDeleted,
    markerNotFoundAndOtherCharacterDeleted,
    noEditor
}

// Define Range interface to avoid direct VSCode dependency
export interface IRange {
    start: IPosition;
    end: IPosition;
}

// Define Position interface to avoid direct VSCode dependency
export interface IPosition {
    line: number;
    character: number;
}

export interface IEditor {
    // Jisyo provider
    getJisyoProvider(): IJisyoProvider;

    // Input mode
    setInputMode(mode: IInputMode): void;
    getCurrentInputMode(): IInputMode;

    // Text manipulation
    insertOrReplaceSelection(str: string): PromiseLike<boolean>;
    replaceRange(range: IRange, str: string): PromiseLike<boolean>;
    getTextInRange(range: IRange): string;
    deleteLeft(): PromiseLike<DeleteLeftResult>;

    // Midashigo management
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
    setMidashigoStartToCurrentPosition(): void;
    clearMidashigo(): PromiseLike<boolean>;
    extractMidashigo(): string | undefined;
    calcMidashigoRange(): IRange | undefined;
    fixateMidashigo(): PromiseLike<boolean>;

    // Candidate management
    showCandidate(candidate: Candidate | undefined, okuri: string, suffix: string): PromiseLike<boolean | void>;
    showCandidateList(candidateList: Candidate[], alphabetList: string[]): void;
    hideCandidateList(): void;
    fixateCandidate(candStr: string | undefined): PromiseLike<boolean>;
    clearCandidate(): PromiseLike<boolean>;

    // UI feedback
    showRemainingRomaji(remainingRomaji: string, isOkuri: boolean, offset: number): void;
    showErrorMessage(message: string): void;
    openRegistrationEditor(yomi: string): PromiseLike<void>;
    registerMidashigo(): PromiseLike<void>;
}