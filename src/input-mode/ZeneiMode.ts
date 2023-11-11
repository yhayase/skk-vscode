import { insertOrReplaceSelection, setInputMode} from "../extension";
import * as vscode from 'vscode';
import { InputMode } from "./InputMode";
import { HiraganaMode } from "./HiraganaMode";

export class ZeneiMode implements InputMode {
    private static zenkakuEisuuList: string[] = [
    "　", "！", "”", "＃", "＄", "％", "＆", "’",
    "（", "）", "＊", "＋", "，", "−", "．", "／",
    "０", "１", "２", "３", "４", "５", "６", "７",
    "８", "９", "：", "；", "＜", "＝", "＞", "？",
    "＠", "Ａ", "Ｂ", "Ｃ", "Ｄ", "Ｅ", "Ｆ", "Ｇ",
    "Ｈ", "Ｉ", "Ｊ", "Ｋ", "Ｌ", "Ｍ", "Ｎ", "Ｏ",
    "Ｐ", "Ｑ", "Ｒ", "Ｓ", "Ｔ", "Ｕ", "Ｖ", "Ｗ",
    "Ｘ", "Ｙ", "Ｚ", "［", "＼", "］", "＾", "＿",
    "‘", "ａ", "ｂ", "ｃ", "ｄ", "ｅ", "ｆ", "ｇ",
    "ｈ", "ｉ", "ｊ", "ｋ", "ｌ", "ｍ", "ｎ", "ｏ",
    "ｐ", "ｑ", "ｒ", "ｓ", "ｔ", "ｕ", "ｖ", "ｗ",
    "ｘ", "ｙ", "ｚ", "｛", "｜", "｝", "〜"
    ];

    public static convertToZenkakuEisuu(key: string): string {
        const firstChar = ' ';
        const lastChar = '~';

        let rval: string = '';
        key.split('').forEach((c) => {
            if (firstChar <= c || c <= lastChar) {
                rval += ZeneiMode.zenkakuEisuuList[c.charCodeAt(0) - firstChar.charCodeAt(0)];
            } else {
                rval += c; // return as is
            }
        });
        return rval;
    }

    // AsciiMode is stateless, so the singleton can be stored in a static field.
    private static instance: ZeneiMode = new ZeneiMode();
    public static getInstance(): ZeneiMode  {
        return this.instance;
    }

    public reset(): void {
        // Do nothing
    }

    public lowerAlphabetInput(key: string): void {
        insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(key));
    }

    public upperAlphabetInput(key: string): void {
        insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(key));
    }

    public spaceInput(): void {
        insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(" "));
    }

    public ctrlJInput(): void {
        setInputMode(HiraganaMode.getInstance());
    }

    public backspaceInput(): void {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            vscode.commands.executeCommand('deleteLeft');
        }
    }

    public numberInput(key: string): void {
        insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(key));
    }
}