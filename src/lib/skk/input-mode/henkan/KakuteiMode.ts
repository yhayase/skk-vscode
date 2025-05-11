import * as vscode from 'vscode';
import { AbstractKanaMode } from '../AbstractKanaMode';
import { AbstractHenkanMode } from './AbstractHenkanMode';
import { RomajiInput } from '../../../../lib/romaji/RomajiInput';
import { MidashigoMode } from './MidashigoMode';
import { AbbrevMode } from './AbbrevMode';
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

    async onLowerAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === 'l') {
            this.editor.setInputMode(AsciiMode.getInstance());
            return;
        }

        if (key === 'q') {
            context.toggleKanaMode();
            return;
        }
        context.insertStringAndShowRemaining(this.romajiInput.processInput(key), this.romajiInput.getRemainingRomaji(), false);
    }

    async onUpperAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === 'L') {
            this.editor.setInputMode(ZeneiMode.getInstance());
            return;
        }

        if (this.romajiInput.getRemainingRomaji().length > 0) {
            // 変換できる文字があればそれを挿入する(例: "n" -> "ん")
            const kana = this.romajiInput.findExactKanaForRomBuffer();
            if (kana !== undefined) {
                await context.insertStringAndShowRemaining(kana, "", false);
                this.romajiInput.reset();
            }
        }
        const midashigoMode = new MidashigoMode(context, this.editor, this.romajiInput.getRemainingRomaji() + key);
        context.setHenkanMode(midashigoMode);
    }

    async onNumber(context: AbstractKanaMode, key: string): Promise<void> {
        this.romajiInput.reset();
        await context.insertStringAndShowRemaining(key, "", false);
    }

    async onSymbol(context: AbstractKanaMode, key: string): Promise<void> {
        // まずはローマ字テーブルを見て、かなや記号に変換できるならば変換する
        let kana = this.romajiInput.processInput(key);
        let remaining = this.romajiInput.getRemainingRomaji();

        // 変換できる文字があればそれを挿入する(例: "n" -> "ん")
        await context.insertStringAndShowRemaining(kana, remaining, false).then(async () => {
            // 「/」が入力された場合は SKK Abbrev mode に移行する
            if (key === "/") {
                // "/" 自体は挿入しない
                this.romajiInput.reset();
                context.setHenkanMode(new AbbrevMode(context, this.editor));
                return;
            }

            // TODO: @ が単体で入力された場合などの特殊な処理を記述する

            // 変換できない場合は， remaining に入っている記号をそのまま挿入
            this.romajiInput.reset();
            await context.insertStringAndShowRemaining(remaining, "", false);
        });
    }

    async onSpace(context: AbstractKanaMode): Promise<void> {
        // "n" のように，仮名にできるローマ字がバッファに残っている場合は，スペースの前に仮名を入力する
        let kana = this.romajiInput.findExactKanaForRomBuffer() ?? "";
        this.romajiInput.reset();
        await context.insertStringAndShowRemaining(kana + " ", "", false);
    }

    async onEnter(context: AbstractKanaMode): Promise<void> {
        this.romajiInput.reset();
        await context.insertStringAndShowRemaining("\n", "", false);
    }

    async onBackspace(context: AbstractKanaMode): Promise<void> {
        if (!this.romajiInput.isEmpty()) {
            this.romajiInput.deleteLastChar();
            await context.insertStringAndShowRemaining("", this.romajiInput.getRemainingRomaji(), false);
            return;
        }

        await this.editor.deleteLeft();
    }

    async onCtrlJ(context: AbstractKanaMode): Promise<void> {
        this.romajiInput.reset();
        await context.insertStringAndShowRemaining("", "", false);
    }

    async onCtrlG(context: AbstractKanaMode): Promise<void> {
        this.romajiInput.reset();
        await context.insertStringAndShowRemaining("", "", false);
    }

    public constructor(context: AbstractKanaMode, editor: IEditor) {
        super("■", editor);
        this.romajiInput = context.newRomajiInput();
    }

    public override getActiveKeys(): Set<string> {
        const keys = new Set<string>();

        // Alphabets for Romaji input
        for (let i = 0; i < 26; i++) {
            keys.add(String.fromCharCode('a'.charCodeAt(0) + i));
        }
        // Shift + Alphabets for Midashigo trigger or special mode change (L)
        for (let i = 0; i < 26; i++) {
            keys.add(`shift+${String.fromCharCode('a'.charCodeAt(0) + i)}`);
        }

        // Numbers
        for (let i = 0; i < 10; i++) {
            keys.add(String(i));
        }

        // Symbols - common ones, specific ones like '/' are handled by onSymbol
        // For simplicity, we can list common symbols or rely on a more generic "any printable"
        // For now, let's add some common ones explicitly.
        // This part might need refinement based on how `when` clauses handle broad categories.
        keys.add(".");
        keys.add(",");
        keys.add("/"); // Special: triggers AbbrevMode
        keys.add("-");
        keys.add("@");
        // Potentially more symbols...

        // Special keys
        keys.add("space");
        keys.add("enter");
        keys.add("backspace");
        keys.add("ctrl+j");
        keys.add("ctrl+g");
        // 'q' and 'l' are handled by AbstractKanaMode or delegated,
        // but KakuteiMode's onLowerAlphabet handles them.
        // 'q' is added by AbstractKanaMode.getActiveKeys().
        // 'l' should be here as it's processed by onLowerAlphabet.
        // keys.add("l"); // Already covered by lowercase alphabet loop

        return keys;
    }

    public getContextualName(): string {
        return "kakutei";
    }
}
