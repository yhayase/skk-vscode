import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { AbstractKanaMode } from "../AbstractKanaMode";
import { MidashigoMode } from "./MidashigoMode";
import { JisyoCandidate } from "../../jisyo";
import * as vscode from 'vscode';
import { KakuteiMode } from "./KakuteiMode";
import { InlineHenkanMode } from "./InlineHenkanMode";
import { IEditor } from "../../editor/IEditor";

export class MenuHenkanMode extends AbstractHenkanMode {
    private prevMode: InlineHenkanMode;
    private candidateList: JisyoCandidate[];
    private candidateIndex: number = 0;

    private readonly selectionKeys = ['a', 's', 'd', 'f', 'j', 'k', 'l'];

    constructor(context: AbstractKanaMode, editor: IEditor, prevMode: InlineHenkanMode, candidateList: JisyoCandidate[]) {
        super("▼", editor);
        this.prevMode = prevMode;
        this.candidateList = candidateList;

        this.editor.showCandidate(undefined);
        this.editor.showCandidateList(this.candidateList.slice(0, this.nDisplayCandidates), this.selectionKeys.map((s) => s.toUpperCase()));
    }

    readonly nDisplayCandidates = 7;

    showCandidateList(context: AbstractKanaMode): void {
        this.editor.showCandidateList(
            this.candidateList.slice(this.candidateIndex, this.candidateIndex + this.nDisplayCandidates),
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
            if (selectedCandidateIdx >= this.candidateList.length) {
                context.showErrorMessage("Out of range");
                return;
            }

            this.hideCandidateList(context);
            this.fixateAndGoKakuteiMode(context, this.candidateList[selectedCandidateIdx]);
            return;
        }
        context.showErrorMessage(`'${key}' is not valid here!`);
        return;
    }

    scrollBackCandidatePage(context: AbstractKanaMode): void {
        this.candidateIndex -= this.nDisplayCandidates;
        if (this.candidateIndex < 0) {
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
        if (this.candidateIndex + this.nDisplayCandidates >= this.candidateList.length) {
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

    private fixateAndGoKakuteiMode(context: AbstractKanaMode, candidate: JisyoCandidate): PromiseLike<boolean> {
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        return this.editor.fixateCandidate(candidate.word);
    }

    onCtrlG(context: AbstractKanaMode): void {
        this.editor.hideCandidateList();
        this.prevMode.returnToMidashigoMode(context);
    }
}