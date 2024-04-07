import * as vscode from 'vscode';
import { AbstractKanaMode } from "../AbstractKanaMode";
import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { RomajiInput } from '../../RomajiInput';
import { MidashigoMode } from './MidashigoMode';
import { setInputMode } from '../../extension';
import { AsciiMode } from '../AsciiMode';
import { ZeneiMode } from '../ZeneiMode';
import { IEditor } from '../../editor/IEditor';


export class KakuteiMode extends AbstractHenkanMode {
    romajiInput: RomajiInput;

    static create(context: AbstractKanaMode, editor: IEditor): KakuteiMode {
        return new KakuteiMode(context, editor);
    }

    reset(): void {
        this.romajiInput.reset();
    }

    onLowerAlphabet(context: AbstractKanaMode, key: string): void {
        if (key === 'l') {
            setInputMode(AsciiMode.getInstance());
            return;
        }

        if (key === 'q') {
            context.toggleKanaMode();
            return;
        }
        context.insertStringAndShowRemaining(this.romajiInput.processInput(key), this.romajiInput.getRemainingRomaji(), false);
    }

    onUpperAlphabet(context: AbstractKanaMode, key: string): void {
        if (key === 'L') {
            setInputMode(ZeneiMode.getInstance());
            return;
        }

        let midashigoMode = new MidashigoMode(context, this.editor, key);
        context.setHenkanMode(midashigoMode);
    }

    onNumber(context: AbstractKanaMode, key: string): void {
        this.romajiInput.reset();
        context.insertStringAndShowRemaining(key, "", false);
    }

    onSymbol(context: AbstractKanaMode, key: string): void {
        // まずはローマ字テーブルを見て、かなや記号に変換できるならば変換する
        let kana = this.romajiInput.processInput(key);
        let remaining = this.romajiInput.getRemainingRomaji();

        // 変換できる文字があればそれを挿入する(例: "n" -> "ん")
        if (kana.length > 0) {
            context.insertStringAndShowRemaining(kana, remaining, false);
            return;
        }

        // TODO: @ が単体で入力された場合などの特殊な処理を記述する

        // 変換できない場合は， remaining に入っている記号をそのまま挿入
        this.romajiInput.reset();
        context.insertStringAndShowRemaining(remaining, "", false);
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

    public constructor(context: AbstractKanaMode, editor: IEditor) {
        super("■", editor);
        this.romajiInput = context.newRomajiInput();
    }

}