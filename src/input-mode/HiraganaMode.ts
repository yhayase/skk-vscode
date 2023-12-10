import { RomajiInput } from '../RomajiInput';
import { InputMode } from './InputMode';
import { KatakanaMode } from './KatakanaMode';
import { AbstractKanaMode } from './AbstractKanaMode';

export class HiraganaMode extends AbstractKanaMode implements InputMode {
    static getInstance(): HiraganaMode {
        return new HiraganaMode();
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
