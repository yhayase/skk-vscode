import { AbstractHenkanMode } from "./AbstractHenkanMode";
import { AbstractKanaMode, DeleteLeftResult } from "../AbstractKanaMode";
import { RomajiInput } from "../../RomajiInput";
import { insertOrReplaceSelection } from "../../extension";
import { JisyoCandidate, globalJisyo } from "../../jisyo";
import { KakuteiMode } from "./KakuteiMode";

export enum MidashigoType {
    gokan, // ▽あ
    okurigana // ▽あ*k
}

export class MidashigoMode extends AbstractHenkanMode {
    private romajiInput: RomajiInput;
    midashigoMode: MidashigoType = MidashigoType.gokan;

    constructor(context: AbstractKanaMode, initialRomajiInput: string|undefined = undefined) {
        super("▽");
        this.romajiInput = context.newRomajiInput();

        if (initialRomajiInput) {
            let insertStr = "▽";
            context.setMidashigoStartToCurrentPosition();
            
            insertStr += this.romajiInput.processInput(initialRomajiInput.toLowerCase());
            context.setMidashigoStartToCurrentPosition();
            context.insertStringAndShowRemaining(insertStr, this.romajiInput.getRemainingRomaji(), false);
        }
    }

    findCandidates(midashigo: string, okuri: string | undefined): JisyoCandidate[]|Error {
        if (okuri) {
            const okuriAlpha = calcFirstAlphabetOfOkurigana(okuri);
            const key = midashigo + okuriAlpha;
            const candidates = globalJisyo.get(key);
            if (candidates === undefined) {
                return new Error('変換できません');
            } else {
                return candidates.map((cand) => new JisyoCandidate(cand.word + okuri, cand.annotation));
            }
        } else {
            const candidates = globalJisyo.get(midashigo);
            if (candidates === undefined) {
                return new Error('変換できません');
            } else {
                return candidates;
            }
        }
    }


    getRomajiInput(): RomajiInput {
        return this.romajiInput;
    }

    onLowerAlphabet(context: AbstractKanaMode, key: string): void {
        if (key === 'q') {
            context.toggleCharTypeInMidashigoAndFixateMidashigo();
            context.setHenkanMode(KakuteiMode.create(context));
            this.romajiInput.reset();
            return;
        }

        if (this.midashigoMode === MidashigoType.okurigana) {
            let okuri = this.romajiInput.processInput(key.toLowerCase());
            if (okuri.length === 0) {
                context.showRemainingRomaji(this.romajiInput.getRemainingRomaji(), true);
                return;
            }

            this.romajiInput.reset();
            context.doHenkan(this, okuri);
            // if (!context.doHenkan(this, okuri)) {
            //     // SKK inserts okuri-gana as gokan when henkan is canceled
            //     this.midashigoMode = MidashigoType.gokan;
            //     insertOrReplaceSelection(okuri).then((value) => {
            //         context.showRemainingRomaji("", false);
            //     });
            //     this.midashigoMode = MidashigoType.gokan;
            // }
            return;
        } else {
            // in case this.midashigoMode === MidashigoType.gokan
            let insertStr = this.romajiInput.processInput(key);
            if (insertStr.length !== 0) {
                insertOrReplaceSelection(insertStr).then((value) => {
                    context.showRemainingRomaji(this.romajiInput.getRemainingRomaji(), false);
                });
            } else {
                context.showRemainingRomaji(this.romajiInput.getRemainingRomaji(), false);
            }
        }

    }
    onUpperAlphabet(context: AbstractKanaMode, key: string): void {
        this.midashigoMode = MidashigoType.okurigana;

        let okuri = this.romajiInput.processInput(key.toLowerCase());
        if (okuri.length === 0) {
            context.showRemainingRomaji(this.romajiInput.getRemainingRomaji(), true);
            return;
        }

        this.romajiInput.reset();
        context.doHenkan(this, okuri);
        // if (!context.doHenkan(this, okuri)) {
        //     // SKK inserts okuri-gana as gokan when henkan is canceled
        //     this.midashigoMode = MidashigoType.gokan;
        //     insertOrReplaceSelection(okuri).then((value) => {
        //         context.showRemainingRomaji("", false);
        //     });
        //     this.midashigoMode = MidashigoType.gokan;
        // }
    }
    onNumber(context: AbstractKanaMode, key: string): void {
        throw new Error("Method not implemented.");
    }
    onSymbol(context: AbstractKanaMode, key: string): void {
        throw new Error("Method not implemented.");
    }
    onSpace(context: AbstractKanaMode): void {
        context.doHenkan(this);
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

        switch(context.deleteLeft()) {
            case DeleteLeftResult.markerDeleted:
            case DeleteLeftResult.markerNotFoundAndOtherCharacterDeleted:
                context.setHenkanMode(KakuteiMode.create(context));
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
        context.fixateMidashigo();
        context.setHenkanMode(KakuteiMode.create(context));
    }
    onCtrlG(context: AbstractKanaMode): void {
        throw new Error("Method not implemented.");
    }
}

function calcFirstAlphabetOfOkurigana(okurigana: string): string|undefined {
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
    