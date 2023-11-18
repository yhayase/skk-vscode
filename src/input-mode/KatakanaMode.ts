import { RomajiInput } from '../RomajiInput';
import { InputMode } from './InputMode';
import { HiraganaMode } from './HiraganaMode';
import { AbstractKanaMode } from './AbstractKanaMode';

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

    protected nextMode() {
        return HiraganaMode.getInstance();
    }
}
