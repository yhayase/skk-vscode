import * as vscode from 'vscode';
import { RomajiInput } from '../RomajiInput';
import { insertOrReplaceSelection, replaceRange } from '../extension';
import { setInputMode } from '../extension';
import { InputMode } from './InputMode';
import { AsciiMode } from './AsciiMode';
import { ZeneiMode } from './ZeneiMode';
import * as wanakana from 'wanakana';
import { KakuteiMode } from './henkan/KakuteiMode';
import { MidashigoMode, MidashigoType } from './henkan/MidashigoMode';
import { AbstractHenkanMode } from './henkan/AbstractHenkanMode';

export enum DeleteLeftResult {
    markerDeleted,
    otherCharacterDeleted,
    markerNotFoundAndOtherCharacterDeleted,
    noEditor
}

export abstract class AbstractKanaMode implements InputMode {
    protected abstract nextMode(): InputMode;
    abstract newRomajiInput(): RomajiInput;

    private henkanMode: AbstractHenkanMode = new KakuteiMode(this);

    private readonly remainingRomajiDecorationType: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
        after: {
            margin: '0 0 0 0em',
            textDecoration: 'none',
        },
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
    });
    
    private midashigoStart: vscode.Position | undefined = undefined;

    setHenkanMode(henkanMode: AbstractHenkanMode) {
        this.henkanMode = henkanMode;
    }

    setMidashigoStartToCurrentPosition() {
        this.midashigoStart = vscode.window.activeTextEditor?.selection.start;
    }

    insertStringAndShowRemaining(str: string, remaining: string, isOkuri: boolean) {
        insertOrReplaceSelection(str).then((value) => {
            this.showRemainingRomaji(remaining, isOkuri);
        });
    }

    public reset(): void {
        this.showRemainingRomaji("", false); // clear remaining romaji annotation
    }

    doHenkan(midashigoMode: MidashigoMode, okuri: string | undefined = undefined): boolean {
        const editor = vscode.window.activeTextEditor;
        if (this.midashigoStart === undefined) {
            vscode.window.showInformationMessage('変換開始位置が不明です');
            this.setHenkanMode(KakuteiMode.create(this));
            // this.romajiInput.reset();
            return false;
        }

        if (editor === undefined) {
            return false;
        }
        // check if content of the editor is longer than midashigoStart
        if (editor.document.getText().length < this.midashigoStart.character) {
            vscode.window.showInformationMessage('変換開始位置が不正です');
            this.setHenkanMode(KakuteiMode.create(this));
            // this.romajiInput.reset();
            return false;
        }

        if (!this.midashigoStart?.isBefore(editor.selection.start)) {
            vscode.window.showInformationMessage('変換開始位置よりも前にカーソルがあります');
            return false;
        }

        const midashigoRange = new vscode.Range(this.midashigoStart, editor.selection.end);
        let midashigo = editor.document.getText(midashigoRange);

        if (midashigo[0] !== '▽') {
            // In case of the begginning ▽ is deleted by the user or other causes

            vscode.window.showInformationMessage('It seems that you have deleted ▽');

            // clear midashigoStart
            this.midashigoStart = undefined;

            this.setHenkanMode(KakuteiMode.create(this));
            return false;
        }

        let candidates = midashigoMode.findCandidates(convertKatakanaToHiragana(midashigo.slice(1)), okuri);

        let success = false;
        if (candidates instanceof Error) {
            vscode.window.showInformationMessage(candidates.message);

            this.setHenkanMode(KakuteiMode.create(this));
            // this.romajiInput.reset();
            return false;
        } else {
            vscode.window.showQuickPick(
                candidates.map((cand) => ({label: cand.word, description: cand.annotation}))
            ).then((selected) => {
                if (selected) {
                    replaceRange(midashigoRange, selected.label);
                    this.showRemainingRomaji("", false);
                    this.setHenkanMode(KakuteiMode.create(this));
                    success = true;
                } else {
                    // FIXME: MidashigoMode の責務が AbstractKanaMode に漏れ出している．リファクタリング途上の汚いコード．

                    // SKK inserts okuri-gana as gokan when henkan is canceled
                    midashigoMode.midashigoMode = MidashigoType.gokan;
                    if (okuri) {
                        insertOrReplaceSelection(okuri).then((value) => {
                            this.showRemainingRomaji("", false);
                        });
                    }
                }

            }, (reasonOfRejection) => {
            });
        }
        return success;
    }

    showRemainingRomaji(remainingRomaji: string, isOkuri: boolean, offset: number = 0) {
        if (remainingRomaji.length === 0) {
            vscode.window.activeTextEditor?.setDecorations(this.remainingRomajiDecorationType, []);
        } else {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.setDecorations(this.remainingRomajiDecorationType, []);
                // annotation position is the same as the cursor position, but the character offset is adjusted
                const pos = editor.selection.start.with(undefined, editor.selection.start.character+offset);
                // create annotation whose content is remainingRomaji
                const remainingRomajiRange = new vscode.Range(pos, pos);
                const prefix = isOkuri ? '*' : '';
                const remainingRomajiAnnotation = {
                    range: remainingRomajiRange,
                    renderOptions: {
                        after: {
                            color: 'green',
                            contentText: prefix + remainingRomaji,
                        }
                    }
                };
                editor.setDecorations(this.remainingRomajiDecorationType, [remainingRomajiAnnotation]);
            }
        }
    }

    public lowerAlphabetInput(key: string): void {
        if (key === 'l') {
            setInputMode(AsciiMode.getInstance());
            vscode.window.showInformationMessage('skk-vscode: ascii mode');
            return;
        }

        this.henkanMode.onLowerAlphabet(this, key);
    }
    toggleKanaMode() {
        let nextMode = this.nextMode();
        setInputMode(nextMode);
    }
    
    public upperAlphabetInput(key: string): void {
        if (key === 'L') {
            setInputMode(ZeneiMode.getInstance());
            vscode.window.showInformationMessage('skk-vscode: 全英 mode');
            return;
        }

        this.henkanMode.onUpperAlphabet(this, key);
    }

    public spaceInput(): void {
        this.henkanMode.onSpace(this);
    }

    public ctrlJInput(): void {
        this.henkanMode.onCtrlJ(this);
    }

    fixateMidashigo() {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.midashigoStart) {
            const midashigoRange = new vscode.Range(this.midashigoStart, editor.selection.end);
            let midashigo = editor.document.getText(midashigoRange);
            if (midashigo[0] === '▽') {
                replaceRange(midashigoRange, midashigo.slice(1));
                this.midashigoStart = undefined;
            } else {
                vscode.window.showInformationMessage('It seems that you have deleted ▽');
                this.midashigoStart = undefined;
            }
        }
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
    toggleCharTypeInMidashigoAndFixateMidashigo() {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.midashigoStart) {
            const midashigoRange = new vscode.Range(this.midashigoStart, editor.selection.end);
            let midashigo = editor.document.getText(midashigoRange);

            if (midashigo[0] !== '▽') {
                return;
            }
            midashigo = midashigo.slice(1);

            // function retruns parameter without any conversion
            function identity<T>(c: T): T {
                return c;
            }
            
            // function converts ascii to full-width ascii
            function toFullWidth(text: string): string {
                return text.replace(/[\x20-\x7E]/g, function(c) {
                    // space
                    if (c === ' ') {
                        return '　';
                    }

                    // other ascii printable characters
                    return String.fromCharCode(c.charCodeAt(0) + 0xFEE0);
                });
            }
            function toHalfWidth(text: string): string {
                return text.replace(/(\u3000|[\uFF01-\uFF5E])/g, function(c) {
                    // full width space
                    if (c === '　') {
                        return ' ';
                    }
                    // other full width ascii characters
                    return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
                });
            }
            function isPrintableAsciiOrAsciiSpace(c: string): boolean {
                if (c.length !== 1) {
                    return false;
                }
                return ' ' <= c && c <= '~';
            }
            function isFullWidthAscii(c: string): boolean {
                if (c.length !== 1) {
                    return false;
                }
                return '！' <= c && c <= '～';
            }

            let convFunc = identity<string>;
            let converted = midashigo.split('').map((c) => {
                if (convFunc === identity<string>) {
                    if (wanakana.isHiragana(c)) {
                        convFunc = wanakana.toKatakana;
                    } else if (wanakana.isKatakana(c)) {
                        convFunc = wanakana.toHiragana;
                    } else if (isPrintableAsciiOrAsciiSpace(c)) {
                        convFunc = toFullWidth;
                    } else if (isFullWidthAscii(c)) {
                        convFunc = toHalfWidth;
                    }
                }
                return convFunc(c);                    
            }).join('');
            
            replaceRange(midashigoRange, converted);
        }
    }

    deleteLeft() : DeleteLeftResult {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.midashigoStart) {
            // Check if the cursor is at the position just after the midashigo start marker, and the character is "▽"
            if (editor.selection.start.character === this.midashigoStart.character+1) {
                if (editor.document.getText(new vscode.Range(this.midashigoStart, editor.selection.start)) === '▽') {
                    vscode.commands.executeCommand('deleteLeft');
                    return DeleteLeftResult.markerDeleted;
                    // No need to reset romajiInput because it is empty
                } else {
                    vscode.window.showInformationMessage('It seems start marker "▽" is gone');
                    vscode.commands.executeCommand('deleteLeft');
                    return DeleteLeftResult.markerNotFoundAndOtherCharacterDeleted;
                }
            } else {
                vscode.commands.executeCommand('deleteLeft');
                return DeleteLeftResult.otherCharacterDeleted;
            }
        }
        return DeleteLeftResult.noEditor;
    }
    
    public backspaceInput(): void {
        this.henkanMode.onBackspace(this);
    }

    public numberInput(key: string): void {
        this.henkanMode.onNumber(this, key);
    }
}

function convertKatakanaToHiragana(src: string): string {
    return src.split('').map((c) => wanakana.isKatakana(c) ? wanakana.toHiragana(c) : c).join('');
}
