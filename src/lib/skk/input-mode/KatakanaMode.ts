import { RomajiInput } from '../../../lib/romaji/RomajiInput';
import { IInputMode } from './IInputMode';
import { HiraganaMode } from './HiraganaMode';
import { AbstractKanaMode } from './AbstractKanaMode';

export class KatakanaMode extends AbstractKanaMode implements IInputMode {
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
