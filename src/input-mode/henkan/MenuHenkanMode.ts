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
    private readonly suffix: string;

    private readonly selectionKeys = ['a', 's', 'd', 'f', 'j', 'k', 'l'];

    constructor(context: AbstractKanaMode, editor: IEditor, prevMode: InlineHenkanMode, jisyoEntry: Entry,
        candidateIndex: number, suffix: string) {
        super("Select", editor);
        this.prevMode = prevMode;
        this.jisyoEntry = jisyoEntry;
        this.candidateIndexStart = candidateIndex;
        this.candidateIndex = candidateIndex;
        this.suffix = suffix;

        this.editor.showCandidate(undefined, this.suffix);
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

    selectCandidateFromMenu(context: AbstractKanaMode, selectionKeys: string[], key: string) {
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
            this.fixateAndGoKakuteiMode(context, selectedCandidateIdx);
            return;
        }
        context.showErrorMessage(`'${key}' is not valid here!`);
        return;
    }

    scrollBackCandidatePage(context: AbstractKanaMode): void {
        this.candidateIndex -= this.nDisplayCandidates;
        if (this.candidateIndex < this.candidateIndexStart) {
            this.returnToInlineHenkanMode(context);
            return;
        }

        this.showCandidateList(context);
    }

    async onLowerAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === 'x') {
            this.scrollBackCandidatePage(context);
            return;
        }

        this.selectCandidateFromMenu(context, this.selectionKeys, key);
    }

    private returnToInlineHenkanMode(context: AbstractKanaMode) {
        this.editor.hideCandidateList();
        context.setHenkanMode(this.prevMode);
        this.prevMode.showCandidate(context);
    }

    async onUpperAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        this.selectCandidateFromMenu(context, this.selectionKeys.map((s) => s.toUpperCase()), key);
    }

    async onNumber(context: AbstractKanaMode, key: string): Promise<void> {
        context.showErrorMessage(`'${key}' is not valid here!`);
    }

    async onSymbol(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === '.') {
            this.editor.openRegistrationEditor(this.prevMode.getMidashigo());
            return;
        }
        throw new Error("Method not implemented.");
    }

    async onSpace(context: AbstractKanaMode): Promise<void> {
        if (this.candidateIndex + this.nDisplayCandidates >= this.jisyoEntry.getCandidateList().length) {
            this.editor.openRegistrationEditor(this.prevMode.getMidashigo());
            return;
        }

        this.candidateIndex += this.nDisplayCandidates;
        this.showCandidateList(context);
    }

    async onEnter(context: AbstractKanaMode): Promise<void> {
        context.showErrorMessage("Enter is not valid here!");
    }

    async onBackspace(context: AbstractKanaMode): Promise<void> {
        this.scrollBackCandidatePage(context);
    }

    async onCtrlJ(context: AbstractKanaMode): Promise<void> {
        context.showErrorMessage("C-j is not valid here!");
    }

    private fixateAndGoKakuteiMode(context: AbstractKanaMode, index: number): PromiseLike<boolean> {
        this.jisyoEntry.onCandidateSelected(this.editor.getJisyoProvider(), index);
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        return this.editor.fixateCandidate(this.jisyoEntry.getCandidateList()[index].word + this.suffix);
    }

    async onCtrlG(context: AbstractKanaMode): Promise<void> {
        this.editor.hideCandidateList();
        this.prevMode.returnToMidashigoMode(context);
    }
}