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
    treatEnterKey: boolean = false;

    static create(context: AbstractKanaMode, editor: IEditor): KakuteiMode {
        return new KakuteiMode(context, editor);
    }

    private async insertKanaAndUpdateRomajiStatus(context: AbstractKanaMode, kana: string, remainingRomaji: string, isOkuri: boolean): Promise<void> {
        if (remainingRomaji.length > 0 && !this.treatEnterKey) {
            this.treatEnterKey = true;
            context["editor"].notifyModeInternalStateChanged(); // Notify editor to update contexts
        } else if (remainingRomaji.length === 0 && this.treatEnterKey) {
            this.treatEnterKey = false;
            context["editor"].notifyModeInternalStateChanged(); // Notify editor to update contexts
        }

        return await context.insertStringAndShowRemaining(kana, remainingRomaji, isOkuri);
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
        this.insertKanaAndUpdateRomajiStatus(context, this.romajiInput.processInput(key), this.romajiInput.getRemainingRomaji(), false);
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
                await this.insertKanaAndUpdateRomajiStatus(context, kana, "", false);
                this.romajiInput.reset();
            }
        }
        const midashigoMode = new MidashigoMode(context, this.editor, this.romajiInput.getRemainingRomaji() + key);
        context.setHenkanMode(midashigoMode);
    }

    async onNumber(context: AbstractKanaMode, key: string): Promise<void> {
        this.romajiInput.reset();
        await this.insertKanaAndUpdateRomajiStatus(context, key, "", false);
    }

    async onSymbol(context: AbstractKanaMode, key: string): Promise<void> {
        // 「@」が入力された場合は SKK Abbrev mode に移行し、today を入力した状態にする
        if (key === "@") {
            // "@" 自体は挿入しない
            this.romajiInput.reset();
            const abbrevMode = new AbbrevMode(context, this.editor);
            context.setHenkanMode(abbrevMode);
            // Workaround: setHenkanMode による画面表示が完了するまで待つ
            await new Promise(resolve => setTimeout(resolve, 50));
            // private メソッドにアクセスするため、as any でキャストする
            (abbrevMode as any)._henkanInternal(context, "today");
            return;
        }

        // まずはローマ字テーブルを見て、かなや記号に変換できるならば変換する
        let kana = this.romajiInput.processInput(key);
        let remaining = this.romajiInput.getRemainingRomaji();

        // 変換できる文字があればそれを挿入する(例: "n" -> "ん")
        await this.insertKanaAndUpdateRomajiStatus(context, kana, remaining, false).then(async () => {
            // 「/」が入力された場合は SKK Abbrev mode に移行する
            if (key === "/") {
                // "/" 自体は挿入しない
                this.romajiInput.reset();
                context.setHenkanMode(new AbbrevMode(context, this.editor));
                return;
            }

            // 変換できない場合は， remaining に入っている記号をそのまま挿入
            this.romajiInput.reset();
            await this.insertKanaAndUpdateRomajiStatus(context, remaining, "", false);
        });
    }

    async onSpace(context: AbstractKanaMode): Promise<void> {
        // "n" のように，仮名にできるローマ字がバッファに残っている場合は，スペースの前に仮名を入力する
        let kana = this.romajiInput.findExactKanaForRomBuffer() ?? "";
        this.romajiInput.reset();
        await this.insertKanaAndUpdateRomajiStatus(context, kana + " ", "", false);
    }

    async onEnter(context: AbstractKanaMode): Promise<void> {
        // "n" のように，仮名にできるローマ字がバッファに残っている場合は，改行の前に仮名を入力する
        const kana = this.romajiInput.findExactKanaForRomBuffer();
        if (kana !== undefined) {
            await this.insertKanaAndUpdateRomajiStatus(context, kana, "", false);
        }

        this.romajiInput.reset();
        await this.insertKanaAndUpdateRomajiStatus(context, "\n", "", false);
    }

    async onBackspace(context: AbstractKanaMode): Promise<void> {
        if (!this.romajiInput.isEmpty()) {
            this.romajiInput.deleteLastChar();
            await this.insertKanaAndUpdateRomajiStatus(context, "", this.romajiInput.getRemainingRomaji(), false);
            return;
        }

        await this.editor.deleteLeft();
    }

    async onCtrlJ(context: AbstractKanaMode): Promise<void> {
        this.romajiInput.reset();
        await this.insertKanaAndUpdateRomajiStatus(context, "", "", false);
    }

    async onCtrlG(context: AbstractKanaMode): Promise<void> {
        this.romajiInput.reset();
        await this.insertKanaAndUpdateRomajiStatus(context, "", "", false);
    }

    public constructor(context: AbstractKanaMode, editor: IEditor) {
        super("■", editor);
        this.romajiInput = context.newRomajiInput();
    }

    public override getActiveKeys(): Set<string> {
        const keys = new Set<string>();

        // this mode deals with all printable ASCII characters
        for (let i = 32; i <= 126; i++) { // ASCII printable characters
            const char = String.fromCharCode(i);
            if ("a" <= char && char <= "z") {
                keys.add(char);
                keys.add("shift+" + char);
            } else if ("A" <= char && char <= "Z") {
                // Uppercase letters are already added by the above case
            } else {
                keys.add(char);
            }
        }

        // Special keys
        keys.add("backspace");
        keys.add("ctrl+j");
        keys.add("ctrl+g");

        // Enter keys are only processed only if needed
        if (this.treatEnterKey) {
            keys.add("enter");
        }

        return keys;
    }

    public getContextualName(): string {
        return "kakutei";
    }
}
