import { JisyoCandidate } from "../jisyo";

export enum DeleteLeftResult {
    markerDeleted,
    otherCharacterDeleted,
    markerNotFoundAndOtherCharacterDeleted,
    noEditor
}

export interface IEditor {
    deleteLeft(): DeleteLeftResult;
    fixateCandidate(candStr: string | undefined): PromiseLike<boolean>;
    clearCandidate(): PromiseLike<boolean | void>;
    showCandidate(candidate: JisyoCandidate | undefined): PromiseLike<boolean | void>;
    toggleCharTypeInMidashigoAndFixateMidashigo(): void;
    clearMidashigo(): PromiseLike<boolean>;
    extractMidashigo(): string | undefined;
    calcMidashigoRange(): any | undefined;
    fixateMidashigo(): PromiseLike<boolean>;
    setMidashigoStartToCurrentPosition(): void;
    hideCandidateList(): void;
    showCandidateList(candidateList: JisyoCandidate[], alphabetList: string[]): void;
    showRemainingRomaji(remainingRomaji: string, isOkuri: boolean, offset: number): void;
    
}