import { IInputMode } from "./IInputMode";
import { HiraganaMode } from "./HiraganaMode";
import { AbstractInputMode } from "./AbstractInputMode";

export class ZeneiMode extends AbstractInputMode {
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
    private static instance: ZeneiMode;
    public static getInstance(): ZeneiMode {
        if (!ZeneiMode.instance) {
            ZeneiMode.instance = new ZeneiMode();
        }
        return this.instance;
    }

    public reset(): void {
        // Do nothing
    }

    public lowerAlphabetInput(key: string): void {
        this.editor.insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(key));
    }

    public upperAlphabetInput(key: string): void {
        this.editor.insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(key));
    }

    public spaceInput(): void {
        this.editor.insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(" "));
    }

    public ctrlJInput(): void {
        this.editor.setInputMode(HiraganaMode.getInstance());
    }

    public ctrlGInput(): void {
        // Do nothing
    }

    public enterInput(): void {
        this.editor.insertOrReplaceSelection("\n");
    }

    public backspaceInput(): void {
        this.editor.deleteLeft();
    }

    public numberInput(key: string): void {
        this.editor.insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(key));
    }

    public symbolInput(key: string): void {
        this.editor.insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(key));
    }
}