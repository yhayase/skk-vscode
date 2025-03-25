import { RomajiInput } from '../lib/romaji/RomajiInput';
import { AbstractInputMode } from './AbstractInputMode';
import { IInputMode } from './IInputMode';
import { AbstractHenkanMode } from './henkan/AbstractHenkanMode';
import { KakuteiMode } from './henkan/KakuteiMode';

/**
 * Parent abstract class of Hiragana and Katakana input modes.
 * This class contains common methods and properties of Hiragana and Katakana input modes.
 */
export abstract class AbstractKanaMode extends AbstractInputMode {
    protected abstract nextMode(): IInputMode;
    abstract newRomajiInput(): RomajiInput;

    private henkanMode: AbstractHenkanMode = new KakuteiMode(this, this.editor);

    setHenkanMode(henkanMode: AbstractHenkanMode) {
        this.henkanMode = henkanMode;
    }

    async insertStringAndShowRemaining(str: string, remaining: string, isOkuri: boolean): Promise<void> {
        await this.editor.insertOrReplaceSelection(str);
        this.editor.showRemainingRomaji(remaining, isOkuri, 0);
        return Promise.resolve();
    }

    public async reset(): Promise<void> {
        this.editor.showRemainingRomaji("", false, 0); // clear remaining romaji annotation
    }

    /**
     * Show error message using standard message box of vscode.
     * @param message string to show
     */
    showErrorMessage(message: string) {
        this.editor.showErrorMessage(message);
    }

    public async lowerAlphabetInput(key: string): Promise<void> {
        await this.henkanMode.onLowerAlphabet(this, key);
    }

    toggleKanaMode() {
        let nextMode = this.nextMode();
        this.editor.setInputMode(nextMode);
    }

    public async upperAlphabetInput(key: string): Promise<void> {
        await this.henkanMode.onUpperAlphabet(this, key);
    }

    public async spaceInput(): Promise<void> {
        await this.henkanMode.onSpace(this);
    }

    public async ctrlJInput(): Promise<void> {
        await this.henkanMode.onCtrlJ(this);
    }

    public async ctrlGInput(): Promise<void> {
        await this.henkanMode.onCtrlG(this);
    }

    public async enterInput(): Promise<void> {
        await this.henkanMode.onEnter(this);
    }

    public async backspaceInput(): Promise<void> {
        await this.henkanMode.onBackspace(this);
    }

    public async numberInput(key: string): Promise<void> {
        await this.henkanMode.onNumber(this, key);
    }

    public async symbolInput(key: string): Promise<void> {
        await this.henkanMode.onSymbol(this, key);
    }
}
