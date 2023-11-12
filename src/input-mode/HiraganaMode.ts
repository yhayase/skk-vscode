import * as vscode from 'vscode';
import { RomajiInput } from '../RomajiInput';
import { InputMode } from './InputMode';
import { KatakanaMode } from './KatakanaMode';
import { AbstractKanaMode } from './AbstractKanaMode';

enum HenkanMode {
    kakutei, // (■モード)
    midashigo, // ▽モード
    henkan // ▼モード
}

enum MidashigoMode {
    start, // ▽あい
    okurigana // ▽あい*s
}

export class HiraganaMode extends AbstractKanaMode implements InputMode {
    private static instance: HiraganaMode = new HiraganaMode();
    static getInstance(): HiraganaMode {
        return HiraganaMode.instance;
    }

    constructor() {
        super(new RomajiInput(false));
    }

    public toString(): string {
        return "かな";
    }

    protected generateWholeYomigana() {
        return '▽かんじ';
    }

    protected generateAllGokan() {
        return "▽か";
    }

    protected generateAllOkurigana(): string[] {
        return ["さ", "し", "す", "せ", "そ"];
    }

    protected nextMode() {
        return KatakanaMode.getInstance();
    }
}
