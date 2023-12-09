import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { AbstractKanaMode } from "../AbstractKanaMode";
import { MidashigoMode } from "./MidashigoMode";
import { JisyoCandidate } from "../../jisyo";
import * as vscode from 'vscode';
import { KakuteiMode } from "./KakuteiMode";
import { MenuHenkanMode } from "./MenuHenkanMode";

export class InlineHenkanMode extends AbstractHenkanMode {
    private prevMode: MidashigoMode;
    private origMidashigo: string;
    private candidateList: JisyoCandidate[];
    private candidateIndex: number = 0;

    constructor(context: AbstractKanaMode, prevMode: MidashigoMode, origMidashigo: string, candidateList: JisyoCandidate[]) {
        super("▼");
        this.prevMode = prevMode;
        this.origMidashigo = origMidashigo;
        this.candidateList = candidateList;

        this.showCandidate(context);
    }

    showCandidate(context: AbstractKanaMode) {
        context.showCandidate(this.candidateList[this.candidateIndex]);
    }

    onLowerAlphabet(context: AbstractKanaMode, key: string): void {
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
            context.fixateCandidate().then(() => {
                context.toggleKanaMode();
                context.setHenkanMode(KakuteiMode.create(context));
            });
        }

        // other keys
        context.fixateCandidate().then(() => {
            context.setHenkanMode(KakuteiMode.create(context));
            context.lowerAlphabetInput(key);
        });
    }

    returnToMidashigoMode(context: AbstractKanaMode) {
        context.setHenkanMode(this.prevMode);
        // recover orijinal midashigo
        context.clearCandidate().then(() => {
            context.insertStringAndShowRemaining("▽" + this.origMidashigo, "", false);
        });
    }

    onUpperAlphabet(context: AbstractKanaMode, key: string): void {
        // in case "X" is input, the current candidate is asked to be deleted.
        // TODO: implement this

        // other keys
        context.fixateCandidate().then(() => {
            context.setHenkanMode(KakuteiMode.create(context));
            return context.upperAlphabetInput(key);
        });
    }
    onNumber(context: AbstractKanaMode, key: string): void {
        context.fixateCandidate();
        context.setHenkanMode(KakuteiMode.create(context));
        context.numberInput(key);
    }
    onSymbol(context: AbstractKanaMode, key: string): void {
        context.fixateCandidate();
        context.setHenkanMode(KakuteiMode.create(context));
        context.symbolInput(key);
    }
    onSpace(context: AbstractKanaMode): void {
        if (this.candidateIndex + 1 >= this.candidateList.length) {
            vscode.window.showInformationMessage("No more candidates");
            return;
        }

        const MAX_INLINE_CANDIDATES = 3;
        if (this.candidateIndex + 1 >= MAX_INLINE_CANDIDATES) {
            context.setHenkanMode(new MenuHenkanMode(context, this, this.candidateList.slice(MAX_INLINE_CANDIDATES)));
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
        context.setHenkanMode(KakuteiMode.create(context));
        return context.fixateCandidate();
    }

    onCtrlG(context: AbstractKanaMode): void {
        this.returnToMidashigoMode(context);
    }
}