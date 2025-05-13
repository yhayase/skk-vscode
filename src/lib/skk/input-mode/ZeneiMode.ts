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
            keys.add(String.fromCharCode(i));
            // Need to consider how to represent these in a normalized way for context keys
            // For single char keys like 'a', '1', '!', it's just the char itself.
            // For 'space', it's "space".
        }

        // Add shift + printable characters as well, as they also result in zenkaku
        for (let i = 32; i <= 126; i++) {
            const char = String.fromCharCode(i);
            // This is a simplification; actual shifted chars depend on layout.
            // Assuming standard US layout for common shifted symbols like !, @, #, etc.
            // and shifted letters A-Z.
            // For simplicity, we'll assume that if 'a' is active, 'shift+a' might also be.
            // However, ZeneiMode converts based on the input char, not its shifted state.
            // So, if 'a' is pressed, it becomes 'ａ'. If 'A' (shift+a) is pressed, it becomes 'Ａ'.
            // The current getActiveKeys model might need refinement for this.
            // For now, let's assume all base printable keys are active.
            // Shifted versions will be separate entries in package.json like "shift+a".
            // So, we should add "shift+<key>" if the base key is a letter.
            if (char >= 'a' && char <= 'z') {
                keys.add(`shift+${char}`);
            }
            // If the key is a number and its shifted version is a symbol (e.g. shift+1 -> !),
            // that symbol is already covered by the loop if it's printable.
        }


        keys.add("ctrl+j"); // Mode switch
        keys.add("ctrl+g"); // Does nothing, but SKK might still "consume" it
        // keys.add("enter"); // Enter or Ctrl+M are disabled. In direct input modes, they should be handled by the editor.
        // keys.add("backspace"); // Backspace should be handled by the editor in direct input modes.

        return keys;
    }

    public getContextualName(): string {
        return "zenei";
    }
}
