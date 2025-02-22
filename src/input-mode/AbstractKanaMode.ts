import * as vscode from 'vscode';
import * as wanakana from 'wanakana';
import { RomajiInput } from '../lib/romaji/RomajiInput';
import { insertOrReplaceSelection, replaceRange, setInputMode } from '../extension';
import { Candidate } from '../jisyo/candidate';
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
        await insertOrReplaceSelection(str);
        this.editor.showRemainingRomaji(remaining, isOkuri, 0);
        return Promise.resolve();
    }

    public reset(): void {
        this.editor.showRemainingRomaji("", false, 0); // clear remaining romaji annotation
    }

    /**
     * Show henkan candidates to the user and let the user select one.
     * @param candidateList The list of candidates to show
     * @returns Thenable that resolves to the selected candidate
     */
    proposeCandidatesToUser(candidateList: Candidate[]): Thenable<{ label: string, description: string | undefined } | undefined> {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return Promise.resolve(undefined);
        }

        const midashigoRange = this.editor.calcMidashigoRange();
        if (midashigoRange === undefined) {
            return Promise.resolve(undefined);
        }

        if (candidateList instanceof Error) {
            vscode.window.showInformationMessage(candidateList.message);

            this.setHenkanMode(KakuteiMode.create(this, this.editor));
            // this.romajiInput.reset();
            return Promise.resolve(undefined);
        }
        return vscode.window.showQuickPick(
            candidateList.map((cand) => ({ label: cand.word, description: cand.annotation }))
        );
    }

    /**
     * Fixate the selected candidate.
     * @param henkanResult The candidate to fixate
     * @returns Promise that resolves to true if the candidate is fixated, false otherwise
     */
    fixateSelectedItem(henkanResult: string): Thenable<boolean | void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return Promise.resolve(false);
        }
        const midashigoRange = this.editor.calcMidashigoRange();
        if (!midashigoRange) {
            return Promise.resolve(false);
        }
        return replaceRange(midashigoRange, henkanResult).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    /**
     * Show error message using standard message box of vscode.
     * @param message string to show
     */
    showErrorMessage(message: string) {
        vscode.window.showErrorMessage(message);
    }

    public lowerAlphabetInput(key: string): void {
        this.henkanMode.onLowerAlphabet(this, key);
    }

    toggleKanaMode() {
        let nextMode = this.nextMode();
        setInputMode(nextMode);
    }

    public upperAlphabetInput(key: string): void {
        this.henkanMode.onUpperAlphabet(this, key);
    }

    public spaceInput(): void {
        this.henkanMode.onSpace(this);
    }

    public ctrlJInput(): void {
        this.henkanMode.onCtrlJ(this);
    }

    public ctrlGInput(): void {
        this.henkanMode.onCtrlG(this);
    }

    public enterInput(): void {
        this.henkanMode.onEnter(this);
    }

    public backspaceInput(): void {
        this.henkanMode.onBackspace(this);
    }

    public numberInput(key: string): void {
        this.henkanMode.onNumber(this, key);
    }

    public symbolInput(key: string) {
        this.henkanMode.onSymbol(this, key);
    }
}
