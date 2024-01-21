import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { AbstractKanaMode } from "../AbstractKanaMode";
import { MidashigoMode } from "./MidashigoMode";
import { JisyoCandidate } from "../../jisyo";
import * as vscode from 'vscode';
import { KakuteiMode } from "./KakuteiMode";
import { MenuHenkanMode } from "./MenuHenkanMode";
import { setInputMode } from "../../extension";
import { AsciiMode } from "../AsciiMode";
import { ZeneiMode } from "../ZeneiMode";
import { IEditor } from "../../editor/IEditor";

export class InlineHenkanMode extends AbstractHenkanMode {
    private prevMode: MidashigoMode;
    private origMidashigo: string;
    private candidateList: JisyoCandidate[];
    private candidateIndex: number = 0;

    constructor(context: AbstractKanaMode, editor: IEditor, prevMode: MidashigoMode, origMidashigo: string, candidateList: JisyoCandidate[]) {
        super("▼", editor);
        this.prevMode = prevMode;
        this.origMidashigo = origMidashigo;
        this.candidateList = candidateList;

        this.showCandidate(context);
    }

    showCandidate(context: AbstractKanaMode) {
        this.editor.showCandidate(this.candidateList[this.candidateIndex]);
    }

    onLowerAlphabet(context: AbstractKanaMode, key: string): void {
        if (key === 'l') {
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
            this.editor.fixateCandidate(undefined).then(() => {
                context.toggleKanaMode();
                context.setHenkanMode(KakuteiMode.create(context, this.editor));
            });
        }

        // other keys
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
            this.editor.fixateCandidate(undefined).then(() => {
                setInputMode(ZeneiMode.getInstance());
            });
            return;
        }

        // in case "X" is input, the current candidate is asked to be deleted from the jisyo
        // TODO: implement this

        // other keys
        this.editor.fixateCandidate(undefined).then(() => {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            return context.upperAlphabetInput(key);
        });
    }
    onNumber(context: AbstractKanaMode, key: string): void {
        this.editor.fixateCandidate(undefined);
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        context.numberInput(key);
    }
    onSymbol(context: AbstractKanaMode, key: string): void {
        this.editor.fixateCandidate(undefined);
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        context.symbolInput(key);
    }
    onSpace(context: AbstractKanaMode): void {
        if (this.candidateIndex + 1 >= this.candidateList.length) {
            vscode.window.showInformationMessage("No more candidates");
            return;
        }

        const MAX_INLINE_CANDIDATES = 3;
        if (this.candidateIndex + 1 >= MAX_INLINE_CANDIDATES) {
            context.setHenkanMode(new MenuHenkanMode(context, this.editor, this, this.candidateList.slice(MAX_INLINE_CANDIDATES)));
            return;
        }

        this.candidateIndex += 1;
        this.showCandidate(context);
    }
    onEnter(context: AbstractKanaMode): void {
        this.fixateAndGoKakuteiMode(context).then(() => {
            context.insertStringAndShowRemaining("\n", "", false);
        });
    }
    onBackspace(context: AbstractKanaMode): void {
        this.fixateAndGoKakuteiMode(context).then(() => {
            vscode.commands.executeCommand('deleteLeft');
        });
    }

    onCtrlJ(context: AbstractKanaMode): void {
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