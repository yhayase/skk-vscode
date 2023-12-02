import { RomajiInput } from '../RomajiInput';
import { InputMode } from './InputMode';
import { KatakanaMode } from './KatakanaMode';
import { AbstractKanaMode } from './AbstractKanaMode';

export class HiraganaMode extends AbstractKanaMode implements InputMode {
    private static instance: HiraganaMode = new HiraganaMode();
    static getInstance(): HiraganaMode {
        return HiraganaMode.instance;
    }

    newRomajiInput(): RomajiInput {
        return new RomajiInput(false);
    }

    public toString(): string {
        return "かな";
    }

    protected nextMode() {
        return KatakanaMode.getInstance();
    }
}
