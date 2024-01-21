import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { AbstractKanaMode } from "../AbstractKanaMode";
import { RomajiInput } from "../../RomajiInput";
import { insertOrReplaceSelection, setInputMode } from "../../extension";
import { JisyoCandidate, getGlobalJisyo } from "../../jisyo";
import { KakuteiMode } from "./KakuteiMode";
import { InlineHenkanMode } from "./InlineHenkanMode";
import { AsciiMode } from "../AsciiMode";
import { ZeneiMode } from "../ZeneiMode";
import { DeleteLeftResult, IEditor } from "../../editor/IEditor";

export enum MidashigoType {
    gokan, // ▽あ
    okurigana // ▽あ*k
}

export class MidashigoMode extends AbstractHenkanMode {
    private romajiInput: RomajiInput;
    midashigoMode: MidashigoType = MidashigoType.gokan;

    constructor(context: AbstractKanaMode, editor: IEditor, initialRomajiInput: string | undefined = undefined) {
        super("▽", editor);
        this.romajiInput = context.newRomajiInput();

        if (initialRomajiInput) {
            let insertStr = "▽";
            this.editor.setMidashigoStartToCurrentPosition();

            insertStr += this.romajiInput.processInput(initialRomajiInput.toLowerCase());
            this.editor.setMidashigoStartToCurrentPosition();
            context.insertStringAndShowRemaining(insertStr, this.romajiInput.getRemainingRomaji(), false);
        }
    }

    findCandidates(midashigo: string, okuri: string): JisyoCandidate[] | Error {
        const okuriAlpha = okuri.length > 0 ? calcFirstAlphabetOfOkurigana(okuri) : "";
        const key = midashigo + okuriAlpha;
        const candidates = getGlobalJisyo().get(key);
        if (candidates === undefined) {
            return new Error('変換できません');
        } else {
            return candidates.map((cand) => new JisyoCandidate(cand.word + okuri, cand.annotation));
        }
    }

    getRomajiInput(): RomajiInput {
        return this.romajiInput;
    }

    henkan(context: AbstractKanaMode, okuri: string): void {
        let midashigo = this.editor.extractMidashigo();
        if (!midashigo || midashigo.length === 0) {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            return;
        }

        let candidateList = this.findCandidates(midashigo, okuri);
        if (candidateList instanceof Error) {
            context.showErrorMessage(candidateList.message);
            return;
        }

        context.setHenkanMode(new InlineHenkanMode(context, this.editor, this, midashigo, candidateList));
    }

    onLowerAlphabet(context: AbstractKanaMode, key: string): void {
        if (key === 'l') {
            this.editor.fixateMidashigo().then(() => {
                setInputMode(AsciiMode.getInstance());
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
            let okuri = this.romajiInput.processInput(key.toLowerCase());
            if (okuri.length === 0) {
                this.editor.showRemainingRomaji(this.romajiInput.getRemainingRomaji(), true, 0);
                return;
            }

            this.romajiInput.reset();
            this.henkan(context, okuri);
        } else {
            // in case this.midashigoMode === MidashigoType.gokan
            let insertStr = this.romajiInput.processInput(key);
            if (insertStr.length !== 0) {
                insertOrReplaceSelection(insertStr).then((value) => {
                    this.editor.showRemainingRomaji(this.romajiInput.getRemainingRomaji(), false, 0);
                });
            } else {
                this.editor.showRemainingRomaji(this.romajiInput.getRemainingRomaji(), false, 0);
            }
        }
    }

    onUpperAlphabet(context: AbstractKanaMode, key: string): void {
        if (key === 'L') {
            this.editor.fixateMidashigo().then(() => {
                setInputMode(ZeneiMode.getInstance());
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
            return this.onLowerAlphabet(context, key.toLowerCase());
        }

        this.midashigoMode = MidashigoType.okurigana;

        let okuri = this.romajiInput.processInput(key.toLowerCase());
        if (okuri.length === 0) {
            this.editor.showRemainingRomaji(this.romajiInput.getRemainingRomaji(), true, 0);
            return;
        }

        this.romajiInput.reset();
        this.henkan(context, okuri);
    }

    onNumber(context: AbstractKanaMode, key: string): void {
        throw new Error("Method not implemented.");
    }

    onSymbol(context: AbstractKanaMode, key: string): void {
        throw new Error("Method not implemented.");
    }

    onSpace(context: AbstractKanaMode): void {
        this.romajiInput.reset();
        this.henkan(context, "");
    }

    onEnter(context: AbstractKanaMode): void {
        throw new Error("Method not implemented.");
    }

    onBackspace(context: AbstractKanaMode): void {
        if (!this.romajiInput.isEmpty()) {
            this.romajiInput.deleteLastChar();
            context.insertStringAndShowRemaining("", this.romajiInput.getRemainingRomaji(), false);
            return;
        }

        switch (this.editor.deleteLeft()) {
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

    onCtrlJ(context: AbstractKanaMode): void {
        this.romajiInput.reset();

        // delete heading ▽ and fix the remaining text
        this.editor.fixateMidashigo();
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
    }

    onCtrlG(context: AbstractKanaMode): void {
        this.romajiInput.reset();
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        this.editor.clearMidashigo();
    }
}

function calcFirstAlphabetOfOkurigana(okurigana: string): string | undefined {
    return kanaToAlphabet.get(okurigana[0]);
}

const kanaToAlphabet = new Map<string, string>([
    ["あ", "a"],
    ["い", "i"],
    ["う", "u"],
    ["え", "e"],
    ["お", "o"],
    ["か", "k"],
    ["が", "g"],
    ["き", "k"],
    ["ぎ", "g"],
    ["く", "k"],
    ["ぐ", "g"],
    ["け", "k"],
    ["げ", "g"],
    ["こ", "k"],
    ["ご", "g"],
    ["さ", "s"],
    ["ざ", "z"],
    ["し", "s"],
    ["じ", "z"],
    ["す", "s"],
    ["ず", "z"],
    ["せ", "s"],
    ["ぜ", "z"],
    ["そ", "s"],
    ["ぞ", "z"],
    ["た", "t"],
    ["だ", "d"],
    ["ち", "t"],
    ["ぢ", "d"],
    ["つ", "t"],
    ["づ", "d"],
    ["て", "t"],
    ["で", "d"],
    ["と", "t"],
    ["ど", "d"],
    ["な", "n"],
    ["に", "n"],
    ["ぬ", "n"],
    ["ね", "n"],
    ["の", "n"],
    ["は", "h"],
    ["ば", "b"],
    ["ぱ", "p"],
    ["ひ", "h"],
    ["び", "b"],
    ["ぴ", "p"],
    ["ふ", "h"],
    ["ぶ", "b"],
    ["ぷ", "p"],
    ["へ", "h"],
    ["べ", "b"],
    ["ぺ", "p"],
    ["ほ", "h"],
    ["ぼ", "b"],
    ["ぽ", "p"],
    ["ま", "m"],
    ["み", "m"],
    ["む", "m"],
    ["め", "m"],
    ["も", "m"],
    ["や", "y"],
    ["ゆ", "y"],
    ["よ", "y"],
    ["ら", "r"],
    ["り", "r"],
    ["る", "r"],
    ["れ", "r"],
    ["ろ", "r"],
    ["わ", "w"],
    ["ゐ", "w"],
    ["ゑ", "w"],
    ["を", "w"],
    ["ん", "n"],
    ["ア", "a"],
    ["イ", "i"],
    ["ウ", "u"],
    ["エ", "e"],
    ["オ", "o"],
    ["カ", "k"],
    ["ガ", "g"],
    ["キ", "k"],
    ["ギ", "g"],
    ["ク", "k"],
    ["グ", "g"],
    ["ケ", "k"],
    ["ゲ", "g"],
    ["コ", "k"],
    ["ゴ", "g"],
    ["サ", "s"],
    ["ザ", "z"],
    ["シ", "s"],
    ["ジ", "z"],
    ["ス", "s"],
    ["ズ", "z"],
    ["セ", "s"],
    ["ゼ", "z"],
    ["ソ", "s"],
    ["ゾ", "z"],
    ["タ", "t"],
    ["ダ", "d"],
    ["チ", "t"],
    ["ヂ", "d"],
    ["ツ", "t"],
    ["ヅ", "d"],
    ["テ", "t"],
    ["デ", "d"],
    ["ト", "t"],
    ["ド", "d"],
    ["ナ", "n"],
    ["ニ", "n"],
    ["ヌ", "n"],
    ["ネ", "n"],
    ["ノ", "n"],
    ["ハ", "h"],
    ["バ", "b"],
    ["パ", "p"],
    ["ヒ", "h"],
    ["ビ", "b"],
    ["ピ", "p"],
    ["フ", "h"],
    ["ブ", "b"],
    ["プ", "p"],
    ["ヘ", "h"],
    ["ベ", "b"],
    ["ペ", "p"],
    ["ホ", "h"],
    ["ボ", "b"],
    ["ポ", "p"],
    ["マ", "m"],
    ["ミ", "m"],
    ["ム", "m"],
    ["メ", "m"],
    ["モ", "m"],
    ["ヤ", "y"],
    ["ユ", "y"],
    ["ヨ", "y"],
    ["ラ", "r"],
    ["リ", "r"],
    ["ル", "r"],
    ["レ", "r"],
    ["ロ", "r"],
    ["ワ", "w"],
    ["ヰ", "w"],
    ["ヱ", "w"],
    ["ヲ", "w"],
    ["ン", "n"],
]);
