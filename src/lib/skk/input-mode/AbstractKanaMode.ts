import { RomajiInput } from '../../romaji/RomajiInput';
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
    protected abstract getKanaModeBaseName(): string; // e.g., "hiragana", "katakana"
    abstract newRomajiInput(): RomajiInput;

    private henkanMode: AbstractHenkanMode = new KakuteiMode(this, this.editor);

    setHenkanMode(henkanMode: AbstractHenkanMode) {
        this.henkanMode = henkanMode;
        this.editor.notifyModeInternalStateChanged(); // Notify editor to update contexts
    }

    async insertStringAndShowRemaining(str: string, remaining: string, isOkuri: boolean): Promise<void> {
        await this.editor.insertOrReplaceSelection(str);
        this.editor.showRemainingRomaji(remaining, isOkuri, 0);
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

    public override getActiveKeys(): Set<string> {
        // Get keys from the current henkanMode (e.g., KakuteiMode, MidashigoMode)
        const activeKeys = new Set(this.henkanMode.getActiveKeys());

        // Add keys that AbstractKanaMode itself handles directly
        // 'q' for toggling kana mode (hiragana <-> katakana)
        activeKeys.add("q"); 
        // 'l' for switching to AsciiMode (handled by henkanMode.onLowerAlphabet, but 'l' itself is a trigger)
        // It's better if henkanMode's getActiveKeys includes 'l' if it's special.
        // For now, let's assume henkanMode (specifically KakuteiMode or MidashigoMode)
        // will list all alphabet keys if it's expecting romaji input.

        // Ctrl+J is handled by henkanMode.onCtrlJ, so it should be in henkanMode.getActiveKeys()
        // Ctrl+G is handled by henkanMode.onCtrlG, so it should be in henkanMode.getActiveKeys()
        // Space, Enter, Backspace are also delegated.

        // Keys for romaji input (a-z) are implicitly active if henkanMode expects them.
        // This means henkanMode.getActiveKeys() should return them.
        // For example, KakuteiMode should return all alphabet keys, numbers, symbols etc.
        // that it can process to form kana.

        return activeKeys;
    }

    public override getContextualName(): string {
        return `${this.getKanaModeBaseName()}:${this.henkanMode.getContextualName()}`;
    }
}
