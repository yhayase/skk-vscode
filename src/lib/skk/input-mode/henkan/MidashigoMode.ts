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

    constructor(context: AbstractKanaMode, editor: IEditor, initialRomajiInput: string = "") {
        super("▽", editor);
        this.romajiInput = context.newRomajiInput();

        const insertStr = "▽" + this.romajiInput.processInput(initialRomajiInput.toLowerCase());
        this.editor.setMidashigoStartToCurrentPosition();
        context.insertStringAndShowRemaining(insertStr, this.romajiInput.getRemainingRomaji(), false);
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
        // TODO: optionalTrailingStr をInlineHenkanMode に渡す
        context.setHenkanMode(new InlineHenkanMode(context, this.editor, this, midashigo, okuriAlphabet, jisyoEntry, okuri, optionalTrailingStr));
    }

    async onLowerAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === 'l') {
            this.editor.fixateMidashigo().then(() => {
                this.editor.setInputMode(AsciiMode.getInstance());
            });
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
            this.editor.fixateMidashigo().then(() => {
                this.editor.setInputMode(ZeneiMode.getInstance());
            });
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
        // まずはローマ字テーブルを見て、かなや記号に変換できるならば変換する
        const kana = this.romajiInput.processInput(key);

        // 以下の記号のいずれかが入力された場合には、その記号を入力するとともに，記号以前の部分について変換を始める
        // 。、．，」』］!！:：;；

        // "n," と入力された場合，kana が "ん、" となる．そのため、最後の1文字で変換を開始するかを決定する
        const lastKana = kana[kana.length - 1];

        if (new Set(["。", "、", "．", "，", "」", "』", "］", "!", "！", ":", "：", ";", "；"]).has(lastKana)) {
            // 最後の1文字を除いた kana を挿入
            this.romajiInput.reset();
            await context.insertStringAndShowRemaining(kana.slice(0, -1), "", false);
            
            await this.henkan(context, "", lastKana);
            return;
        }

        // 変換できる文字があればそれを挿入して終了
        if (kana.length > 0) {
            const remaining = this.romajiInput.getRemainingRomaji();
            await context.insertStringAndShowRemaining(kana, remaining, false);
            return;
        }

        throw new Error("Method not implemented.");
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
}

