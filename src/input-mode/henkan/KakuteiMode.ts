import * as vscode from 'vscode';
import { AbstractKanaMode } from "../AbstractKanaMode";
import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { RomajiInput } from '../../RomajiInput';
import { MidashigoMode } from './MidashigoMode';


export class KakuteiMode extends AbstractHenkanMode {
    romajiInput: RomajiInput;

    static create(context: AbstractKanaMode): KakuteiMode {
        return new KakuteiMode(context);
    }

    reset(): void {
        this.romajiInput.reset();
    }

    onLowerAlphabet(context: AbstractKanaMode, key: string): void {
        if (key === 'q') {
            context.toggleKanaMode();
            return;
        }
        context.insertStringAndShowRemaining(this.romajiInput.processInput(key), this.romajiInput.getRemainingRomaji(), false);
    }

    onUpperAlphabet(context: AbstractKanaMode, key: string): void {
        let midashigoMode = new MidashigoMode(context, key);
        context.setHenkanMode(midashigoMode);
    }

    onNumber(context: AbstractKanaMode, key: string): void {
        this.romajiInput.reset();
        context.insertStringAndShowRemaining(key, "", false);
    }

    onSymbol(context: AbstractKanaMode, key: string): void {
        // TODO: @ などの特殊な記号の処理を追加する
        this.romajiInput.reset();
        context.insertStringAndShowRemaining(key, "", false);
    }

    onSpace(context: AbstractKanaMode): void {
        this.romajiInput.reset();
        context.insertStringAndShowRemaining(" ", "", false);
    }

    onEnter(context: AbstractKanaMode): void {
        this.romajiInput.reset();
        context.insertStringAndShowRemaining("\n", "", false);
    }

    onBackspace(context: AbstractKanaMode): void {
        if (!this.romajiInput.isEmpty()) {
            this.romajiInput.deleteLastChar();
            context.insertStringAndShowRemaining("", this.romajiInput.getRemainingRomaji(), false);
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            vscode.commands.executeCommand('deleteLeft');
        }
    }

    onCtrlJ(context: AbstractKanaMode): void {
        this.romajiInput.reset();
        context.insertStringAndShowRemaining("", "", false);
    }

    onCtrlG(context: AbstractKanaMode): void {
        this.romajiInput.reset();
        context.insertStringAndShowRemaining("", "", false);
    }

    public constructor(context: AbstractKanaMode) {
        super("■");
        this.romajiInput = context.newRomajiInput();
    }

}