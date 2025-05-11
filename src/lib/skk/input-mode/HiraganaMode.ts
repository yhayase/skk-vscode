import { RomajiInput } from '../../../lib/romaji/RomajiInput';
import { IInputMode } from './IInputMode';
import { KatakanaMode } from './KatakanaMode';
import { AbstractKanaMode } from './AbstractKanaMode';

export class HiraganaMode extends AbstractKanaMode implements IInputMode {
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

    protected getKanaModeBaseName(): string {
        return "hiragana";
    }
}
