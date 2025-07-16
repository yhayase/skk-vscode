import { IEditor } from "../../editor/IEditor";
import { Entry } from "../../jisyo/entry";
import { AbstractKanaMode } from "../AbstractKanaMode";
import { AsciiMode } from "../AsciiMode";
import { ZeneiMode } from "../ZeneiMode";
import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { KakuteiMode } from "./KakuteiMode";
import { MenuHenkanMode } from "./MenuHenkanMode";
import { AbstractMidashigoMode } from "./AbstractMidashigoMode";
import { CandidateDeletionMode } from './CandidateDeletionMode';
import { MidashigoMode } from './MidashigoMode'; // 追加
import wanakana = require('wanakana');

export class InlineHenkanMode extends AbstractHenkanMode {
    private readonly prevMode: AbstractMidashigoMode;
    private readonly origMidashigo: string;
    private readonly okuriAlphabet: string;
    private readonly jisyoEntry: Entry;
    private candidateIndex: number = 0;
    private readonly suffix: string;
    private readonly okuri: string;

    constructor(context: AbstractKanaMode, editor: IEditor, prevMode: AbstractMidashigoMode, origMidashigo: string, okuriAlphabet: string, jisyoEntry: Entry, okuri: string, optionalSuffix?: string) {
        super("▼", editor);
        this.prevMode = prevMode;
        this.origMidashigo = origMidashigo;
        this.okuriAlphabet = okuriAlphabet;
        this.jisyoEntry = jisyoEntry;
        this.okuri = okuri;
        this.suffix = optionalSuffix || "";

        this.showCandidate(context);
    }

    showCandidate(context: AbstractKanaMode) {
        this.editor.showCandidate(this.jisyoEntry.getCandidateList()[this.candidateIndex], this.okuri, this.suffix);
    }

    /**
     * Asynchronously fixates the current candidate and inserts the suffix after the fixed candidate.
     * @param context The current Kana mode
     * @returns Promise that resolves to true if the candidate is successfully fixated, false otherwise.
     */
    async fixateCandidate(context: AbstractKanaMode): Promise<boolean> {
        let rval = await this.editor.fixateCandidate(this.jisyoEntry.getCandidateList()[this.candidateIndex].word + this.okuri + this.suffix);
        if (!rval) {
            return false;
        }
        await context.insertStringAndShowRemaining("", "", false);
        return true;
    }

    async onLowerAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === 'l') {
            this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), this.candidateIndex);
            await this.fixateCandidate(context);
            this.editor.setInputMode(AsciiMode.getInstance());
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
            this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), this.candidateIndex);
            await this.fixateCandidate(context);
            context.toggleKanaMode();
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
        }

        // other keys
        this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), this.candidateIndex);
        await this.fixateAndGoKakuteiMode(context);
        await context.lowerAlphabetInput(key);
    }

    async returnToMidashigoMode(context: AbstractKanaMode) {
        context.setHenkanMode(this.prevMode);
        this.prevMode.resetOkuriState();
        await this.editor.clearCandidate();
        await context.insertStringAndShowRemaining("▽" + this.origMidashigo + this.okuri + this.suffix, "", false);
    }

    async clearMidashigoAndReturnToKakuteiMode(context: AbstractKanaMode) {
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        await this.editor.clearCandidate();
        await context.insertStringAndShowRemaining("", "", false);
    }

    async onUpperAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === 'L') {
            this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), this.candidateIndex);
            await this.fixateCandidate(context);
            this.editor.setInputMode(ZeneiMode.getInstance());
            return;
        }

        if (key === 'X') {
            const rawMidashigo = this.getMidashigo();

            // lookup the raw candidates again because entries in this.candidateList may be cooked and have okurigana.
            const rawCandidateList = await this.editor.getJisyoProvider().lookupCandidates(rawMidashigo);
            if (rawCandidateList === undefined) {
                throw new Error("Unconsistent state: Candidate list is not found in the global jisyo.");
            }

            context.setHenkanMode(new CandidateDeletionMode(context, this.editor, this, rawMidashigo, rawCandidateList.getCandidateList()[this.candidateIndex]));
            return;
        }

        // other keys
        this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), this.candidateIndex);
        await this.fixateAndGoKakuteiMode(context);
        await context.upperAlphabetInput(key);
    }

    async onNumber(context: AbstractKanaMode, key: string): Promise<void> {
        this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), this.candidateIndex);
        await this.fixateAndGoKakuteiMode(context);
        await context.numberInput(key);
    }

    async onSymbol(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === '>') {
            await this.fixateCandidate(context);
            const midashigoMode = await MidashigoMode.create(context, this.editor, '', '>');
            context.setHenkanMode(midashigoMode);
            return;
        }

        this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), this.candidateIndex);
        await this.fixateAndGoKakuteiMode(context);
        await context.symbolInput(key);
    }

    async onSpace(context: AbstractKanaMode): Promise<void> {
        if (this.candidateIndex + 1 >= this.jisyoEntry.getCandidateList().length) {
            await this.editor.openRegistrationEditor(this.getMidashigo(), this.okuri);
            return;
        }

        const MAX_INLINE_CANDIDATES = 3;
        if (this.candidateIndex + 1 >= MAX_INLINE_CANDIDATES) {
            context.setHenkanMode(new MenuHenkanMode(context, this.editor, this, this.jisyoEntry, this.candidateIndex + 1, this.okuri, this.suffix));
            return;
        }

        this.candidateIndex += 1;
        this.showCandidate(context);
    }

    async onEnter(context: AbstractKanaMode): Promise<void> {
        this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), this.candidateIndex);
        await this.fixateAndGoKakuteiMode(context);
        await context.insertStringAndShowRemaining("\n", "", false);
    }

    async onBackspace(context: AbstractKanaMode): Promise<void> {
        this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), this.candidateIndex);
        await this.fixateAndGoKakuteiMode(context);
        await this.editor.deleteLeft();
    }

    async onCtrlJ(context: AbstractKanaMode): Promise<void> {
        this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), this.candidateIndex);
        await this.fixateAndGoKakuteiMode(context);
    }

    private async fixateAndGoKakuteiMode(context: AbstractKanaMode): Promise<boolean> {
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        return await this.fixateCandidate(context);
    }

    async onCtrlG(context: AbstractKanaMode): Promise<void> {
        await this.returnToMidashigoMode(context);
    }

    /**
     * 辞書の見出し語に使えない文字を、使える文字に変換する。具体的には、カタカナをひらがなに変換する。
     * @returns {string} 辞書の見出し語
     */
    getMidashigo(): string {
        return this.origMidashigo.split("").map((char) => {
            return wanakana.isKatakana(char) ? wanakana.toHiragana(char) : char;
        }).join("") + this.okuriAlphabet;
    }

    public override getActiveKeys(): Set<string> {
        const keys = new Set<string>();

        // this mode deals with all printable ASCII characters
        for (let i = 32; i <= 126; i++) { // ASCII printable characters
            const char = String.fromCharCode(i);
            if ("a"<= char && char <= "z") {
                keys.add(char);
                keys.add("shift+" + char);
            } else if ("A" <= char && char <= "Z") {
                // Uppercase letters are already added by the above case
            } else {
                keys.add(char);
            }
        }
        keys.add("greater"); // '>' symbol

        // Special keys
        keys.add("enter");
        keys.add("backspace");
        keys.add("ctrl+j");
        keys.add("ctrl+g");

        return keys;
    }

    public getContextualName(): string {
        return "inlineHenkan";
    }
}
