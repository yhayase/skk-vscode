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
            if (firstChar <= c && c <= lastChar) { // Corrected condition: || to &&
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
        return new ZeneiMode();
    }

    public async reset(): Promise<void> {
        // Do nothing
    }

    public async lowerAlphabetInput(key: string): Promise<void> {
        await this.editor.insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(key));
    }

    public async upperAlphabetInput(key: string): Promise<void> {
        await this.editor.insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(key));
    }

    public async spaceInput(): Promise<void> {
        await this.editor.insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(" "));
    }

    public async ctrlJInput(): Promise<void> {
        this.editor.setInputMode(HiraganaMode.getInstance());
    }

    public async ctrlGInput(): Promise<void> {
        // Do nothing
    }

    public async enterInput(): Promise<void> {
        await this.editor.insertOrReplaceSelection("\n");
    }

    public async backspaceInput(): Promise<void> {
        await this.editor.deleteLeft();
    }

    public async numberInput(key: string): Promise<void> {
        await this.editor.insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(key));
    }

    public async symbolInput(key: string): Promise<void> {
        await this.editor.insertOrReplaceSelection(ZeneiMode.convertToZenkakuEisuu(key));
    }

    public override getActiveKeys(): Set<string> {
        const keys = new Set<string>();
        // All printable ASCII characters are handled by ZeneiMode to convert to Zenkaku
        for (let i = 32; i <= 126; i++) { // ASCII printable characters
            const char = String.fromCharCode(i);
            if ('a' <= char && char <= 'z') {
                keys.add(char);
                keys.add(`shift+${char}`);
            } else if ('A' <= char && char <= 'Z') {
                // Uppsercase letters are already added by the above case
            } else {
                keys.add(char);
            }
        }

        keys.add("ctrl+j"); // Mode switch to Hiragana mode
        // "ctrl+g", "enter", or "backspace" are ignored by this mode. the editor must handle them.

        return keys;
    }

    public getContextualName(): string {
        return "zenei";
    }
}
