import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { AbstractKanaMode } from "../AbstractKanaMode";
import { KakuteiMode } from "./KakuteiMode";
import { InlineHenkanMode } from "./InlineHenkanMode";
import { IEditor } from "../../editor/IEditor";
import { Entry } from "../../jisyo/entry";

export class MenuHenkanMode extends AbstractHenkanMode {
    private readonly prevMode: InlineHenkanMode;
    private readonly jisyoEntry: Entry;
    private readonly candidateIndexStart: number;
    private candidateIndex: number;
    private readonly okuri: string;
    private readonly suffix: string;

    private readonly selectionKeys = ['a', 's', 'd', 'f', 'j', 'k', 'l'];

    constructor(context: AbstractKanaMode, editor: IEditor, prevMode: InlineHenkanMode, jisyoEntry: Entry,
        candidateIndex: number, okuri: string, suffix: string) {
        super("Select", editor);
        this.prevMode = prevMode;
        this.jisyoEntry = jisyoEntry;
        this.candidateIndexStart = candidateIndex;
        this.candidateIndex = candidateIndex;
        this.okuri = okuri;
        this.suffix = suffix;

        this.editor.showCandidate(undefined, this.okuri, this.suffix);
        this.showCandidateList(context);
    }

    readonly nDisplayCandidates = 7;

    showCandidateList(context: AbstractKanaMode): void {
        this.editor.showCandidateList(
            this.jisyoEntry.getCandidateList().slice(this.candidateIndex, this.candidateIndex + this.nDisplayCandidates),
            this.selectionKeys.map((s) => s.toUpperCase()));
    }

    hideCandidateList(context: AbstractKanaMode): void {
        this.editor.hideCandidateList();
    }

    async selectCandidateFromMenu(context: AbstractKanaMode, selectionKeys: string[], key: string): Promise<void> {
        if (selectionKeys.includes(key)) {
            const idx = selectionKeys.indexOf(key);
            if (idx >= this.nDisplayCandidates) {
                context.showErrorMessage("Out of range");
                return;
            }

            const selectedCandidateIdx = this.candidateIndex + idx;
            if (selectedCandidateIdx >= this.jisyoEntry.getCandidateList().length) {
                context.showErrorMessage("Out of range");
                return;
            }

            this.hideCandidateList(context);
            await this.fixateAndGoKakuteiMode(context, selectedCandidateIdx);
            return;
        }
        context.showErrorMessage(`'${key}' is not valid here!`);
        return;
    }

    async scrollBackCandidatePage(context: AbstractKanaMode): Promise<void> {
        this.candidateIndex -= this.nDisplayCandidates;
        if (this.candidateIndex < this.candidateIndexStart) {
            await this.returnToInlineHenkanMode(context);
            return;
        }

        this.showCandidateList(context);
        this.editor.notifyModeInternalStateChanged(); // Notify about candidate index change
    }

    async onLowerAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === 'x') {
            await this.scrollBackCandidatePage(context);
            return;
        }

        await this.selectCandidateFromMenu(context, this.selectionKeys, key);
    }

    private async returnToInlineHenkanMode(context: AbstractKanaMode): Promise<void> {
        this.editor.hideCandidateList();
        context.setHenkanMode(this.prevMode);
        await this.prevMode.showCandidate(context);
    }

    async onUpperAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        await this.selectCandidateFromMenu(context, this.selectionKeys.map((s) => s.toUpperCase()), key);
    }

    async onNumber(context: AbstractKanaMode, key: string): Promise<void> {
        context.showErrorMessage(`'${key}' is not valid here!`);
    }

    async onSymbol(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === '.') {
            await this.editor.openRegistrationEditor(this.prevMode.getMidashigo(), this.okuri);
            return;
        }
        throw new Error("Method not implemented.");
    }

    async onSpace(context: AbstractKanaMode): Promise<void> {
        if (this.candidateIndex + this.nDisplayCandidates >= this.jisyoEntry.getCandidateList().length) {
            await this.editor.openRegistrationEditor(this.prevMode.getMidashigo(), this.okuri);
            return;
        }

        this.candidateIndex += this.nDisplayCandidates;
        this.showCandidateList(context);
    }

    async onEnter(context: AbstractKanaMode): Promise<void> {
        context.showErrorMessage("Enter is not valid here!");
    }

    async onBackspace(context: AbstractKanaMode): Promise<void> {
        await this.scrollBackCandidatePage(context);
    }

    async onCtrlJ(context: AbstractKanaMode): Promise<void> {
        context.showErrorMessage("C-j is not valid here!");
    }

    private async fixateAndGoKakuteiMode(context: AbstractKanaMode, index: number): Promise<boolean> {
        this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), index);
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        return await this.editor.fixateCandidate(this.jisyoEntry.getCandidateList()[index].word + this.okuri + this.suffix);
    }

    async onCtrlG(context: AbstractKanaMode): Promise<void> {
        this.editor.hideCandidateList();
        await this.prevMode.returnToMidashigoMode(context);
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

        // Special keys
        keys.add("enter");
        keys.add("backspace");
        keys.add("ctrl+j");
        keys.add("ctrl+g");

        return keys;
    }

    public override getContextualName(): string {
        return "menuHenkan";
    }
}
