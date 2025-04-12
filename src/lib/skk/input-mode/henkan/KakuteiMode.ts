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

}