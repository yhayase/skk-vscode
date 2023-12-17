import { RomajiInput } from '../RomajiInput';
import { InputMode } from './InputMode';
import { HiraganaMode } from './HiraganaMode';
import { AbstractKanaMode } from './AbstractKanaMode';

export class KatakanaMode extends AbstractKanaMode implements InputMode {
    static getInstance(): KatakanaMode {
        return new KatakanaMode();
    }

    newRomajiInput(): RomajiInput {
        return new RomajiInput(true);
    }

    public toString(): string {
        return "カナ";
    }

    protected nextMode() {
        return HiraganaMode.getInstance();
    }
}
