import * as vscode from 'vscode';
import { RomajiInput } from '../RomajiInput';
import { InputMode } from './InputMode';
import { HiraganaMode } from './HiraganaMode';
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

export class KatakanaMode extends AbstractKanaMode implements InputMode {
    private static instance: KatakanaMode = new KatakanaMode();
    static getInstance(): KatakanaMode {
        return KatakanaMode.instance;
    }

    constructor() {
        super(new RomajiInput(true));
    }

    public toString(): string {
        return "カナ";
    }

    protected generateWholeYomigana() {
        return '▽カンジ';
    }

    protected generateAllGokan() {
        return "▽カ";
    }

    protected generateAllOkurigana(): string[] {
        return ["サ", "シ", "ス", "セ", "ソ"];
    }

    protected nextMode() {
        return HiraganaMode.getInstance();
    }
}
