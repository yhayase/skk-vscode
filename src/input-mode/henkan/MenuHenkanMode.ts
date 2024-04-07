import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { AbstractKanaMode } from "../AbstractKanaMode";
import * as vscode from 'vscode';
import { KakuteiMode } from "./KakuteiMode";
import { InlineHenkanMode } from "./InlineHenkanMode";
import { IEditor } from "../../editor/IEditor";
import { Entry } from "../../jisyo/entry";

export class MenuHenkanMode extends AbstractHenkanMode {
    private prevMode: InlineHenkanMode;
    private jisyoEntry: Entry;
    private readonly candidateIndexStart: number;
    private candidateIndex: number;
    private readonly suffix: string;

    private readonly selectionKeys = ['a', 's', 'd', 'f', 'j', 'k', 'l'];

    constructor(context: AbstractKanaMode, editor: IEditor, prevMode: InlineHenkanMode, jisyoEntry: Entry,
        candidateIndex: number, suffix: string) {
        super("▼", editor);
        this.prevMode = prevMode;
        this.jisyoEntry = jisyoEntry;
        this.candidateIndexStart = this.candidateIndex = candidateIndex;
        this.suffix = suffix;

        this.editor.showCandidate(undefined, this.suffix);
        //this.editor.showCandidateList(this.jisyoEntry.getCandidateList().slice(0, this.nDisplayCandidates), this.selectionKeys.map((s) => s.toUpperCase()));
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

    onLowerAlphabet(context: AbstractKanaMode, key: string): void {
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

    onUpperAlphabet(context: AbstractKanaMode, key: string): void {
        this.selectCandidateFromMenu(context, this.selectionKeys.map((s) => s.toUpperCase()), key);
    }

    onNumber(context: AbstractKanaMode, key: string): void {
        context.showErrorMessage(`'${key}' is not valid here!`);
    }

    onSymbol(context: AbstractKanaMode, key: string): void {
        // In case "." is input, start touroku mode
        // TODO: implement this
        throw new Error("Method not implemented.");
    }

    onSpace(context: AbstractKanaMode): void {
        if (this.candidateIndex + this.nDisplayCandidates >= this.jisyoEntry.getCandidateList().length) {
            vscode.window.showInformationMessage("No more candidates");
            return;
        }

        this.candidateIndex += this.nDisplayCandidates;
        this.showCandidateList(context);
    }

    onEnter(context: AbstractKanaMode): void {
        context.showErrorMessage("Enter is not valid here!");
    }

    onBackspace(context: AbstractKanaMode): void {
        this.scrollBackCandidatePage(context);
    }

    onCtrlJ(context: AbstractKanaMode): void {
        context.showErrorMessage("C-j is not valid here!");
    }

    private fixateAndGoKakuteiMode(context: AbstractKanaMode, index: number): PromiseLike<boolean> {
        this.jisyoEntry.onCandidateSelected(index);
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        return this.editor.fixateCandidate(this.jisyoEntry.getCandidateList()[index].word + this.suffix);
    }

    onCtrlG(context: AbstractKanaMode): void {
        this.editor.hideCandidateList();
        this.prevMode.returnToMidashigoMode(context);
    }
}