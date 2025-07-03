import { RomajiInput } from "../../../../lib/romaji/RomajiInput";
import { DeleteLeftResult, IEditor } from "../../editor/IEditor";
import { Entry } from "../../jisyo/entry";
import { AbstractKanaMode } from "../AbstractKanaMode";
import { AsciiMode } from "../AsciiMode";
import { ZeneiMode } from "../ZeneiMode";
import { AbstractMidashigoMode } from "./AbstractMidashigoMode";
import { InlineHenkanMode } from "./InlineHenkanMode";
import { KakuteiMode } from "./KakuteiMode";
import { lookupOkuriAlphabet } from "../../jisyo/okuri";

export enum MidashigoType {
    gokan, // ▽あ
    okurigana // ▽あ*k
}

export class MidashigoMode extends AbstractMidashigoMode {
    private romajiInput: RomajiInput;
    private midashigoMode: MidashigoType = MidashigoType.gokan;

    private constructor(context: AbstractKanaMode, editor: IEditor) {
        super("▽", editor);
        this.romajiInput = context.newRomajiInput();
    }

    public static async create(context: AbstractKanaMode, editor: IEditor, initialRomajiInput: string = "", initialYomiInput: string = ""): Promise<MidashigoMode> {
        const mode = new MidashigoMode(context, editor);

        const insertStr = `▽${initialYomiInput}${mode.romajiInput.processInput(initialRomajiInput.toLowerCase())}`;
        mode.editor.setMidashigoStartToCurrentPosition();
        await context.insertStringAndShowRemaining(insertStr, mode.romajiInput.getRemainingRomaji(), false);

        return mode;
    }

    resetOkuriState(): void {
        this.midashigoMode = MidashigoType.gokan;
    }

    async findCandidates(midashigo: string, okuri: string): Promise<Entry | undefined> {
        const { key, keyForLookup } = this.createJisyoKey(midashigo, okuri);
        return await this.editor.getJisyoProvider().lookupCandidates(keyForLookup);
    }

    private createJisyoKey(midashigo: string, okuri: string): { key: string, keyForLookup: string } {
        const okuriAlphabet = okuri.length > 0 ? (lookupOkuriAlphabet(okuri) || "") : "";
        const key = midashigo + okuriAlphabet;
        const keyForLookup = this.romajiInput.convertKanaToHiragana(key);
        return { key, keyForLookup };
    }

    private async henkan(context: AbstractKanaMode, okuri: string, optionalTrailingStr?: string): Promise<void> {
        const midashigo = this.editor.extractMidashigo();
        if (!midashigo || midashigo.length === 0) {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            return;
        }

        const jisyoEntry = await this.findCandidates(midashigo, okuri);
        if (jisyoEntry === undefined) {
            const { keyForLookup } = this.createJisyoKey(midashigo, okuri);
            await this.editor.openRegistrationEditor(keyForLookup, okuri);
            return;
        }

        const okuriAlphabet = okuri.length > 0 ? (lookupOkuriAlphabet(okuri) || "") : "";
        context.setHenkanMode(new InlineHenkanMode(context, this.editor, this, midashigo, okuriAlphabet, jisyoEntry, okuri, optionalTrailingStr));
    }

    async onLowerAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === 'l') {
            await this.editor.fixateMidashigo();
            this.editor.setInputMode(AsciiMode.getInstance());
            return;
        }

        if (key === 'q') {
            this.editor.toggleCharTypeInMidashigoAndFixateMidashigo();
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            this.romajiInput.reset();
            return;
        }

        if (this.midashigoMode === MidashigoType.okurigana) {
            const okuri = this.romajiInput.processInput(key.toLowerCase());
            if (okuri.length === 0) {
                this.editor.showRemainingRomaji(this.romajiInput.getRemainingRomaji(), true, 0);
                return;
            }

            this.romajiInput.reset();
            await this.henkan(context, okuri);
        } else {
            // in case this.midashigoMode === MidashigoType.gokan
            const insertStr = this.romajiInput.processInput(key);
            if (insertStr.length !== 0) {
                await this.editor.insertOrReplaceSelection(insertStr).then((value) => {
                    this.editor.showRemainingRomaji(this.romajiInput.getRemainingRomaji(), false, 0);
                });
            } else {
                this.editor.showRemainingRomaji(this.romajiInput.getRemainingRomaji(), false, 0);
            }
        }
    }

    async onUpperAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === 'L') {
            await this.editor.fixateMidashigo();
            this.editor.setInputMode(ZeneiMode.getInstance());
            return;
        }

        const midashigo = this.editor.extractMidashigo();
        if (midashigo === undefined) {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            this.editor.showRemainingRomaji("", false, 0);
            return;
        }

        if (midashigo.length === 0) {
            return await this.onLowerAlphabet(context, key.toLowerCase());
        }

        this.midashigoMode = MidashigoType.okurigana;
        this.editor.notifyModeInternalStateChanged(); // Notify editor about state change


        // ローマ字の変換を行う。
        const kanaForRemainedRomaji = this.romajiInput.findExactKanaForRomBuffer();
        if (kanaForRemainedRomaji !== undefined) {
            this.romajiInput.reset();
        }

        const kana = this.romajiInput.processInput(key.toLowerCase());
        const remainingRomaji = this.romajiInput.getRemainingRomaji();
        await context.insertStringAndShowRemaining(kanaForRemainedRomaji || "", remainingRomaji, true);
        if (kana.length === 0) {
            return;
        }
        
        await this.henkan(context, kana);
    }

    async onNumber(context: AbstractKanaMode, key: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async onSymbol(context: AbstractKanaMode, key: string): Promise<void> {
        // 接頭辞入力のための「>」の処理
        if (key === '>') {
            // "n" のように，仮名にできるローマ字がバッファに残っている場合は，仮名を入力してから変換を開始する
            const kana = this.romajiInput.findExactKanaForRomBuffer() ?? "";
            this.romajiInput.reset();
            await context.insertStringAndShowRemaining(kana + key, "", false);

            const midashigo = this.editor.extractMidashigo();
            if (midashigo && midashigo.length > 0) {
                await this.henkan(context, "");
            }
            return;
        }

        // ローマ字テーブルを参照し、かなや記号に変換可能な場合に変換を行う
        const kana = this.romajiInput.processInput(key);

        // 特定の記号が入力された場合、記号以前の部分を変換開始し、記号を挿入
        const punctuationMarks = new Set(["。", "、", "．", "，", "」", "』", "］", "!", "！", ":", "：", ";", "；"]);
        const lastKana = kana[kana.length - 1];
        if (punctuationMarks.has(lastKana)) {
            this.romajiInput.reset();
            await context.insertStringAndShowRemaining(kana.slice(0, -1), "", false);
            await this.henkan(context, "", lastKana);
            return;
        }

        // それ以外の場合は、かなをそのまま挿入
        if (kana.length > 0) {
            const remaining = this.romajiInput.getRemainingRomaji();
            await context.insertStringAndShowRemaining(kana, remaining, false);
            return;
        }
    }

    async onSpace(context: AbstractKanaMode): Promise<void> {
        // "n" のように，仮名にできるローマ字がバッファに残っている場合は，仮名を入力してから変換を開始する
        const kana = this.romajiInput.findExactKanaForRomBuffer() ?? "";
        this.romajiInput.reset();
        await context.insertStringAndShowRemaining(kana, "", false);
        await this.henkan(context, "");
    }

    async onEnter(context: AbstractKanaMode): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async onBackspace(context: AbstractKanaMode): Promise<void> {
        if (!this.romajiInput.isEmpty()) {
            this.romajiInput.deleteLastChar();
            await context.insertStringAndShowRemaining("", this.romajiInput.getRemainingRomaji(), false);
            if (this.romajiInput.isEmpty()) {
                this.midashigoMode = MidashigoType.gokan;
                this.editor.notifyModeInternalStateChanged(); // Notify editor about state change
            }
            return;
        }

        switch (await this.editor.deleteLeft()) {
            case DeleteLeftResult.markerDeleted:
            case DeleteLeftResult.markerNotFoundAndOtherCharacterDeleted:
                context.setHenkanMode(KakuteiMode.create(context, this.editor));
                break;
            case DeleteLeftResult.otherCharacterDeleted:
                // do nothing
                break;
            case DeleteLeftResult.noEditor:
                // error
                break;
        }
    }

    async onCtrlJ(context: AbstractKanaMode): Promise<void> {
        this.romajiInput.reset();

        // delete heading ▽ and fix the remaining text
        await this.editor.fixateMidashigo();
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
    }

    async onCtrlG(context: AbstractKanaMode): Promise<void> {
        this.romajiInput.reset();
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        await this.editor.clearMidashigo();
    }

    public override getActiveKeys(): Set<string> {
        const keys = new Set<string>();

        // this mode deals with all printable ASCII characters
        for (let i = 32; i <= 126; i++) { // ASCII printable characters
            const char = String.fromCharCode(i);
            if ("a" <= char && char <= "z") {
                keys.add(char);
                keys.add("shift+" + char); // Use lowercase char for shift combinations
            } else if ("A" <= char && char <= "Z") {
                // Uppercase letters are already added by the above case
            } else {
                keys.add(char);
            }
        }

        // Special keys
        keys.add("enter");
        keys.add("backspace");
        keys.add("ctrl+j");
        keys.add("ctrl+g");
        keys.add("greater"); // Added for prefix conversion

        return keys;
    }

    public override getContextualName(): string {
        if (this.midashigoMode === MidashigoType.gokan) {
            return "midashigo:gokan";
        } else {
            return "midashigo:okurigana";
        }
    }
}
