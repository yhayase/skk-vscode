import * as vscode from 'vscode';
import { IEditor } from "../../editor/IEditor";
import { setInputMode } from "../../extension";
import { Entry } from "../../jisyo/entry";
import { AbstractKanaMode } from "../AbstractKanaMode";
import { AsciiMode } from "../AsciiMode";
import { ZeneiMode } from "../ZeneiMode";
import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { KakuteiMode } from "./KakuteiMode";
import { MenuHenkanMode } from "./MenuHenkanMode";
import { MidashigoMode } from "./MidashigoMode";

export class InlineHenkanMode extends AbstractHenkanMode {
    private prevMode: MidashigoMode;
    private origMidashigo: string;
    private jisyoEntry: Entry;
    private candidateIndex: number = 0;

    constructor(context: AbstractKanaMode, editor: IEditor, prevMode: MidashigoMode, origMidashigo: string, jisyoEntry: Entry) {
        super("▼", editor);
        this.prevMode = prevMode;
        this.origMidashigo = origMidashigo;
        this.jisyoEntry = jisyoEntry;

        this.showCandidate(context);
    }

    showCandidate(context: AbstractKanaMode) {
        this.editor.showCandidate(this.jisyoEntry.getCandidateList()[this.candidateIndex]);
    }

    onLowerAlphabet(context: AbstractKanaMode, key: string): void {
        if (key === 'l') {
            this.jisyoEntry.onCandidateSelected(this.candidateIndex);
            this.editor.fixateCandidate(undefined).then(() => {
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
            this.editor.fixateCandidate(undefined).then(() => {
                context.toggleKanaMode();
                context.setHenkanMode(KakuteiMode.create(context, this.editor));
            });
        }

        // other keys
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.editor.fixateCandidate(undefined).then(() => {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            context.lowerAlphabetInput(key);
        });
    }

    returnToMidashigoMode(context: AbstractKanaMode) {
        context.setHenkanMode(this.prevMode);
        // recover orijinal midashigo
        this.editor.clearCandidate().then(() => {
            context.insertStringAndShowRemaining("▽" + this.origMidashigo, "", false);
        });
    }

    onUpperAlphabet(context: AbstractKanaMode, key: string): void {
        if (key === 'L') {
            this.jisyoEntry.onCandidateSelected(this.candidateIndex);
            this.editor.fixateCandidate(undefined).then(() => {
                setInputMode(ZeneiMode.getInstance());
            });
            return;
        }

        // in case "X" is input, the current candidate is asked to be deleted from the jisyo
        // TODO: implement this

        // other keys
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.editor.fixateCandidate(undefined).then(() => {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            return context.upperAlphabetInput(key);
        });
    }
    onNumber(context: AbstractKanaMode, key: string): void {
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.editor.fixateCandidate(undefined);
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        context.numberInput(key);
    }
    onSymbol(context: AbstractKanaMode, key: string): void {
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.editor.fixateCandidate(undefined);
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        context.symbolInput(key);
    }
    onSpace(context: AbstractKanaMode): void {
        if (this.candidateIndex + 1 >= this.jisyoEntry.getCandidateList().length) {
            vscode.window.showInformationMessage("No more candidates");
            return;
        }

        const MAX_INLINE_CANDIDATES = 3;
        if (this.candidateIndex + 1 >= MAX_INLINE_CANDIDATES) {
            context.setHenkanMode(new MenuHenkanMode(context, this.editor, this, this.jisyoEntry, this.candidateIndex + 1));
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
            vscode.commands.executeCommand('deleteLeft');
        });
    }

    onCtrlJ(context: AbstractKanaMode): void {
        this.jisyoEntry.onCandidateSelected(this.candidateIndex);
        this.fixateAndGoKakuteiMode(context);
    }

    private fixateAndGoKakuteiMode(context: AbstractKanaMode): PromiseLike<boolean> {
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        return this.editor.fixateCandidate(undefined);
    }

    onCtrlG(context: AbstractKanaMode): void {
        this.returnToMidashigoMode(context);
    }
}