import * as fs from "fs";

export class JisyoCandidate {
    word: string;
    annotation?: string;

    constructor(word: string, annotation?: string) {
        this.word = word;
        this.annotation = annotation;
    }
};

type Jisyo = Map<string, JisyoCandidate[]>;

export const globalJisyo: Jisyo = new Map([
    ["かんじ", [new JisyoCandidate("漢字", "中国から伝わった文字"), new JisyoCandidate("幹事", "宴会の幹事")]],
    ["かs", [new JisyoCandidate("課", "税金を〜"), new JisyoCandidate("貸", "お金を〜")]]
]);

