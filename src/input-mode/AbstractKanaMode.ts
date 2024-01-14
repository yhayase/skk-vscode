import * as vscode from 'vscode';
import { RomajiInput } from '../RomajiInput';
import { insertOrReplaceSelection, replaceRange } from '../extension';
import { setInputMode } from '../extension';
import { IInputMode } from './IInputMode';
import { AsciiMode } from './AsciiMode';
import { ZeneiMode } from './ZeneiMode';
import * as wanakana from 'wanakana';
import { KakuteiMode } from './henkan/KakuteiMode';
import { MidashigoMode, MidashigoType } from './henkan/MidashigoMode';
import { AbstractHenkanMode } from './henkan/AbstractHenkanMode';
import { JisyoCandidate } from '../jisyo';
import { AbstractInputMode } from './AbstractInputMode';
import { DeleteLeftResult } from '../editor/IEditor';


export abstract class AbstractKanaMode extends AbstractInputMode {
    protected abstract nextMode(): IInputMode;
    abstract newRomajiInput(): RomajiInput;

    private henkanMode: AbstractHenkanMode = new KakuteiMode(this);


    setHenkanMode(henkanMode: AbstractHenkanMode) {
        this.henkanMode = henkanMode;
    }

    setMidashigoStartToCurrentPosition() {
        this.editor.setMidashigoStartToCurrentPosition();
    }

    insertStringAndShowRemaining(str: string, remaining: string, isOkuri: boolean) {
        insertOrReplaceSelection(str).then((value) => {
            this.showRemainingRomaji(remaining, isOkuri);
        });
    }

    public reset(): void {
        this.showRemainingRomaji("", false); // clear remaining romaji annotation
    }

    /**
     * Calculate the range of the midashigo, which is started by "▽" and ended by the cursor position.
     * @param editor active text editor
     * @returns Range of the midashigo.  If any inconsistency found, returns undefined.
     */
    public calcMidashigoRange(editor: vscode.TextEditor): vscode.Range | undefined {
        return this.editor.calcMidashigoRange();
    }

    /**
     * Extract text from the midashigo start marker to the cursor position without heading marker "▽".
     * @returns extracted text.  If any inconsistency found, returns undefined.
     */
    public extractMidashigo(): string | undefined {
        return this.editor.extractMidashigo();
    }

    /**
     * Show henkan candidates to the user and let the user select one.
     * @param candidateList The list of candidates to show
     * @returns Thenable that resolves to the selected candidate
     */
    proposeCandidatesToUser(candidateList: JisyoCandidate[]): Thenable<{ label: string, description: string | undefined } | undefined> {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return Promise.resolve(undefined);
        }

        const midashigoRange = this.calcMidashigoRange(editor);
        if (midashigoRange === undefined) {
            return Promise.resolve(undefined);
        }

        let success = false;
        if (candidateList instanceof Error) {
            vscode.window.showInformationMessage(candidateList.message);

            this.setHenkanMode(KakuteiMode.create(this));
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
        const midashigoRange = this.calcMidashigoRange(editor);
        if (!midashigoRange) {
            return Promise.resolve(false);
        }
        return replaceRange(midashigoRange, henkanResult).then((value) => {
            this.showRemainingRomaji("", false);
        });
    }

    /**
     * Show error message using standard message box of vscode.
     * @param message string to show
     */
    showErrorMessage(message: string) {
        vscode.window.showErrorMessage(message);
    }

    /**
     * Whole henkan process is contained in this method.
     * @deprecated Use extractMidashigo() and proposeCandidatesToUser() separately.
     * @param midashigoMode callback class to call findCandidates() and showCandidate()
     * @param okuri okuri-gana string if exists
     * @returns success or not
     */
    doHenkan(midashigoMode: MidashigoMode, okuri: string): boolean {
        let midashigo = this.extractMidashigo();
        if (!midashigo) {
            return false;
        }

        let candidates = midashigoMode.findCandidates(convertKatakanaToHiragana(midashigo), okuri);
        if (candidates instanceof Error) {
            vscode.window.showInformationMessage(candidates.message);

            this.setHenkanMode(KakuteiMode.create(this));
            return false;
        }

        this.proposeCandidatesToUser(candidates).then((selected) => {
            if (selected) {
                this.fixateSelectedItem(selected.label).then((value) => {
                    this.showRemainingRomaji("", false);
                    this.setHenkanMode(KakuteiMode.create(this));
                });
            } else {
                // SKK inserts okuri-gana as gokan when henkan is canceled
                midashigoMode.midashigoMode = MidashigoType.gokan;

                // but there is no okurigana on Space key
                if (okuri) {
                    insertOrReplaceSelection(okuri).then((value) => {
                        this.showRemainingRomaji("", false);
                    });
                }
            }
        });

        return true;
    }

    showRemainingRomaji(remainingRomaji: string, isOkuri: boolean, offset: number = 0): void {
        this.editor.showRemainingRomaji(remainingRomaji, isOkuri, offset);
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

    /**
     * Fixate the unconversioned midashigo.
     * 
     */
    fixateMidashigo(): PromiseLike<boolean> {
        return this.editor.fixateMidashigo();
    }

    clearMidashigo(): PromiseLike<boolean> {
        return this.editor.clearMidashigo();
    }


    /**
     * Change character type according to the first character of the midashigo
     * and fixate the midashigo.
     * In case of the first character is
     * - hiragana, convert all appearing hiragana to katakana,
     * - katakana, convert all appearing katakana to hiragana,
     * - ascii, convert all appearing ascii to full-width ascii.
     * - full-width ascii, convert all appearing full-width ascii to ascii.
     * @returns void
     */
    toggleCharTypeInMidashigoAndFixateMidashigo(): void {
        this.editor.toggleCharTypeInMidashigoAndFixateMidashigo();
    }

    showCandidateList(candidateList: JisyoCandidate[], alphabetList: string[]): void {
        this.editor.showCandidateList(candidateList, alphabetList);
    }

    hideCandidateList(): void {
        this.editor.hideCandidateList();
    }

    /**
     * Show henkan candidates over the midashigo.
     * @param candidate The candidate to show
     * @returns Promise that resolves to true if the candidate is shown, false otherwise
     */
    showCandidate(candidate: JisyoCandidate | undefined): PromiseLike<boolean | void> {
        return this.editor.showCandidate(candidate);
    }

    clearCandidate(): PromiseLike<boolean | void> {
        return this.editor.clearCandidate();
    }

    /**
     * Fixate the candidate shown over the midashigo.
     *
     * This method fixate the range from "▼" to the cursor position, then hide the annotation.
     */
    fixateCandidate(candStr: string | undefined = undefined): PromiseLike<boolean> {
        return this.editor.fixateCandidate(candStr);
    }


    /**
     * Basically, delete the character just before the cursor.
     * If the cursor is at the position just after the midashigo start marker, and the character is "▽",
     * delete the marker and notify the caller.
     * If the cursor is at the position just after the midashigo start marker, and the character is not "▽",
     * delete the character and notify the caller.
     */
    deleteLeft(): DeleteLeftResult {
        return this.editor.deleteLeft();
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

function convertKatakanaToHiragana(src: string): string {
    return src.split('').map((c) => wanakana.isKatakana(c) ? wanakana.toHiragana(c) : c).join('');
}
