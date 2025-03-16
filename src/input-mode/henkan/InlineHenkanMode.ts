import { IEditor } from "../../editor/IEditor";
import { setInputMode } from "../../extension";
import { Entry } from "../../jisyo/entry";
import { AbstractKanaMode } from "../AbstractKanaMode";
import { AsciiMode } from "../AsciiMode";
import { ZeneiMode } from "../ZeneiMode";
import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { KakuteiMode } from "./KakuteiMode";
import { MenuHenkanMode } from "./MenuHenkanMode";
import { AbstractMidashigoMode } from "./AbstractMidashigoMode";
import { toHiragana } from 'wanakana';
import { CandidateDeletionMode } from './CandidateDeletionMode';
import { getGlobalJisyo } from '../../jisyo/jisyo';

export class InlineHenkanMode extends AbstractHenkanMode {
    private readonly prevMode: AbstractMidashigoMode;
    private readonly origMidashigo: string;
    private readonly okuriAlphabet: string;
    private readonly jisyoEntry: Entry;
    private candidateIndex: number = 0;
    private readonly suffix: string;

    constructor(context: AbstractKanaMode, editor: IEditor, prevMode: AbstractMidashigoMode, origMidashigo: string, okuriAlphabet: string, jisyoEntry: Entry, optionalSuffix?: string) {
        super("▼", editor);
        this.prevMode = prevMode;
        this.origMidashigo = origMidashigo;
        this.okuriAlphabet = okuriAlphabet;
        this.jisyoEntry = jisyoEntry;
        this.suffix = optionalSuffix || "";

        this.showCandidate(context);
    }

    showCandidate(context: AbstractKanaMode) {
        this.editor.showCandidate(this.jisyoEntry.getCandidateList()[this.candidateIndex], this.suffix);
    }

    /**
     * Asynchronously fixates the current candidate and inserts the suffix after the fixed candidate.
     * @param context The current Kana mode
     * @returns Promise that resolves to true if the candidate is successfully fixated, false otherwise.
     */
    async fixateCandidate(context: AbstractKanaMode): Promise<boolean> {
        let rval = await this.editor.fixateCandidate(undefined);
        if (!rval) {
            return false;
        }
        await context.insertStringAndShowRemaining(this.suffix, "", false);
        return true;
    }

    onLowerAlphabet(context: AbstractKanaMode, key: string): void {
        if (key === 'l') {
            this.jisyoEntry.onCandidateSelected(this.candidateIndex);
            this.fixateCandidate(context).then(() => {
                setInputMode(AsciiMode.getInstance());
            });
            return;
        }

        if (key === 'x') {
            this.candidateIndex -= 1;
            if (this.candidateIndex < 0) {
                this.returnToMidashigoMode(context);
                return;
            }

            this.showCandidate(context);
            return;
        }

        if (key === 'q') {
            this.jisyoEntry.onCandidateSelected(this.candidateIndex);
            this.fixateCandidate(context).then(() => {
                context.toggleKanaMode();
                context.setHenkanMode(KakuteiMode.create(context, this.editor));
            });
        }

        // other keys
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.fixateCandidate(context).then(() => {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            context.lowerAlphabetInput(key);
        });
    }

    returnToMidashigoMode(context: AbstractKanaMode) {
        context.setHenkanMode(this.prevMode);
        // recover orijinal midashigo
        this.editor.clearCandidate().then(() => {
            context.insertStringAndShowRemaining("▽" + this.origMidashigo + this.suffix, "", false);
        });
    }

    clearMidashigoAndReturnToKakuteiMode(context: AbstractKanaMode) {
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        this.editor.clearCandidate().then(() => {
            context.insertStringAndShowRemaining("", "", false);
        });
    }

    onUpperAlphabet(context: AbstractKanaMode, key: string): void {
        if (key === 'L') {
            this.jisyoEntry.onCandidateSelected(this.candidateIndex);
            this.fixateCandidate(context).then(() => {
                setInputMode(ZeneiMode.getInstance());
            });
            return;
        }

        if (key === 'X') {
            const rawMidashigo = this.getMidashigo();

            // lookup the raw candidates again because entries in this.candidateList may be cooked and have okurigana.
            const rawCandidateList = getGlobalJisyo().get(rawMidashigo);
            if (rawCandidateList === undefined) {
                throw new Error("Unconsistent state: Candidate list is not found in the global jisyo.");
            }

            context.setHenkanMode(new CandidateDeletionMode(context, this.editor, this, rawMidashigo, rawCandidateList[this.candidateIndex]));
            return;
        }

        // other keys
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.fixateCandidate(context).then(() => {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            return context.upperAlphabetInput(key);
        });
    }
    onNumber(context: AbstractKanaMode, key: string): void {
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.fixateCandidate(context);
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        context.numberInput(key);
    }
    onSymbol(context: AbstractKanaMode, key: string): void {
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.fixateCandidate(context).then(() => {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            context.symbolInput(key);
        });
    }
    onSpace(context: AbstractKanaMode): void {
        if (this.candidateIndex + 1 >= this.jisyoEntry.getCandidateList().length) {
            this.editor.openRegistrationEditor(this.getMidashigo());
            return;
        }

        const MAX_INLINE_CANDIDATES = 3;
        if (this.candidateIndex + 1 >= MAX_INLINE_CANDIDATES) {
            context.setHenkanMode(new MenuHenkanMode(context, this.editor, this, this.jisyoEntry, this.candidateIndex + 1, this.suffix));
            return;
        }

        this.candidateIndex += 1;
        this.showCandidate(context);
    }
    onEnter(context: AbstractKanaMode): void {
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.fixateAndGoKakuteiMode(context).then(() => {
            context.insertStringAndShowRemaining("\n", "", false);
        });
    }
    onBackspace(context: AbstractKanaMode): void {
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.fixateAndGoKakuteiMode(context).then(() => {
            this.editor.deleteLeft();
        });
    }

    onCtrlJ(context: AbstractKanaMode): void {
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.fixateAndGoKakuteiMode(context);
    }

    private fixateAndGoKakuteiMode(context: AbstractKanaMode): PromiseLike<boolean> {
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        return this.fixateCandidate(context);
    }

    onCtrlG(context: AbstractKanaMode): void {
        this.returnToMidashigoMode(context);
    }

    getMidashigo() {
        return toHiragana(this.origMidashigo) + this.okuriAlphabet;
    }
}