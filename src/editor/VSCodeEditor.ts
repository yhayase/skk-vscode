import * as vscode from 'vscode';
import { replaceRange } from '../extension';
import { Candidate } from '../jisyo/candidate';
import { DeleteLeftResult, IEditor } from "./IEditor";
import wanakana = require('wanakana');

export class VSCodeEditor implements IEditor {
    private midashigoStart: vscode.Position | undefined = undefined;

    setMidashigoStartToCurrentPosition(): void {
        this.midashigoStart = vscode.window.activeTextEditor?.selection.start;
    }

    private readonly remainingRomajiDecorationType: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
        after: {
            margin: '0 0 0 0em',
            textDecoration: 'none',
        },
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
    });

    private readonly candidateListDecorationType: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
        after: {
            margin: '0 0 0 0em',
            textDecoration: 'underline',
        },
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
    });

    showRemainingRomaji(remainingRomaji: string, isOkuri: boolean, offset: number = 0): void {
        if (remainingRomaji.length === 0) {
            vscode.window.activeTextEditor?.setDecorations(this.remainingRomajiDecorationType, []);
        } else {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.setDecorations(this.remainingRomajiDecorationType, []);
                // annotation position is the same as the cursor position, but the character offset is adjusted
                const pos = editor.selection.start.with(undefined, editor.selection.start.character + offset);
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

    showCandidateList(candidateList: Candidate[], alphabetList: string[]): void {
        const candidateStr = candidateList.map((cand, idx) => {
            return `${alphabetList[idx]}:  ${cand.word}`; // + (cand.annotation ? "; " + cand.annotation : "");
        }).join('  ');

        if (candidateStr.length === 0) {
            this.hideCandidateList();
        } else {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.setDecorations(this.candidateListDecorationType, []);
                // calculate the position of the end of line
                const pos = new vscode.Position(editor.selection.start.line, 0);
                // const pos = editor.document.lineAt(editor.selection.active.line).range.end;
                const displayRange = new vscode.Range(pos, pos);
                const candidateListAnnotation = {
                    range: displayRange,
                    renderOptions: {
                        after: {
                            backgroundColor: 'lightgreen',
                            contentText: candidateStr
                        }
                    }
                };
                editor.setDecorations(this.candidateListDecorationType, [candidateListAnnotation]);
            }
        }
    }

    hideCandidateList(): void {
        vscode.window.activeTextEditor?.setDecorations(this.candidateListDecorationType, []);
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
                return text.replace(/[\x20-\x7E]/g, function (c) {
                    // space
                    if (c === ' ') {
                        return '　';
                    }

                    // other ascii printable characters
                    return String.fromCharCode(c.charCodeAt(0) + 0xFEE0);
                });
            }
            function toHalfWidth(text: string): string {
                return text.replace(/(\u3000|[\uFF01-\uFF5E])/g, function (c) {
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

    /**
     * Fixate the unconversioned midashigo.
     * 
     */
    fixateMidashigo(): PromiseLike<boolean> {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.midashigoStart) {
            const midashigoRange = new vscode.Range(this.midashigoStart, editor.selection.end);
            let midashigo = editor.document.getText(midashigoRange);
            if (midashigo[0] === '▽') {
                this.midashigoStart = undefined;
                return replaceRange(midashigoRange, midashigo.slice(1));
            }
            vscode.window.showInformationMessage('It seems that you have deleted ▽');
            this.midashigoStart = undefined;
        }
        return Promise.resolve(false);
    }

    /**
     * Calculate the range of the midashigo, which is started by "▽" and ended by the cursor position.
     * @param editor active text editor
     * @returns Range of the midashigo.  If any inconsistency found, returns undefined.
     */
    public calcMidashigoRange(): vscode.Range | undefined {
        if (this.midashigoStart === undefined) {
            vscode.window.showInformationMessage('変換開始位置が不明です');
            return undefined;
        }

        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return undefined;
        }

        // check if content of the editor is longer than midashigoStart
        if (editor.document.getText().length < this.midashigoStart.character) {
            vscode.window.showInformationMessage('変換開始位置が不正です');
            return undefined;
        }

        if (!this.midashigoStart?.isBefore(editor.selection.start)) {
            vscode.window.showInformationMessage('変換開始位置よりも前にカーソルがあります');
            return undefined;
        }

        return new vscode.Range(this.midashigoStart, editor.selection.end);
    }

    /**
     * Extract text from the midashigo start marker to the cursor position without heading marker "▽".
     * @returns extracted text.  If any inconsistency found, returns undefined.
     */
    public extractMidashigo(): string | undefined {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return undefined;
        }

        const midashigoRange = this.calcMidashigoRange();
        const midashigo = editor.document.getText(midashigoRange);

        if (midashigo[0] !== '▽') {
            // In case of the begginning ▽ is deleted by the user or other causes
            vscode.window.showInformationMessage('It seems that you have deleted ▽');

            // clear midashigoStart
            this.midashigoStart = undefined;

            return undefined;
        }

        return midashigo.slice(1); // remove heading "▽" and return
    }

    clearMidashigo(): PromiseLike<boolean> {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.midashigoStart) {
            const midashigoRange = new vscode.Range(this.midashigoStart, editor.selection.end);
            let midashigo = editor.document.getText(midashigoRange);
            if (midashigo[0] === '▽') {
                this.midashigoStart = undefined;
                return replaceRange(midashigoRange, "");
            }
            vscode.window.showInformationMessage('It seems that you have deleted ▽');
            this.midashigoStart = undefined;
        }
        return Promise.resolve(false);
    }
    
    /**
     * Show henkan candidates over the midashigo.
     * @param candidate The candidate to show
     * @param suffix Additional string to show after the candidate. e.g. "、" or "。"
     * @returns Promise that resolves to true if the candidate is shown, false otherwise
     */
    showCandidate(candidate: Candidate | undefined, suffix: string): PromiseLike<boolean | void> {
        if (this.midashigoStart && vscode.window.activeTextEditor) {
            const midashigoRange = new vscode.Range(this.midashigoStart, vscode.window.activeTextEditor?.selection.end);

            if (!candidate) {
                return replaceRange(midashigoRange, "▼").then((value) => {
                    this.showRemainingRomaji(suffix, false);
                });
            }

            return replaceRange(midashigoRange, "▼" + candidate.word).then((value) => {
                if (candidate.annotation) {
                    this.showRemainingRomaji("; " + candidate.annotation + suffix, false);
                } else {
                    this.showRemainingRomaji(suffix, false);
                }
            });
        }
        // hide the annotation
        this.showRemainingRomaji("", false);
        return Promise.resolve(false);
    }

    clearCandidate(): PromiseLike<boolean | void> {
        this.showRemainingRomaji("", false);
        if (this.midashigoStart && vscode.window.activeTextEditor) {
            const candidateRange = new vscode.Range(this.midashigoStart, vscode.window.activeTextEditor?.selection.end);
            // extract string in candidateRange
            let candidate = vscode.window.activeTextEditor.document.getText(candidateRange);
            // head of candidate must be "▼"
            if (candidate[0] !== '▼') {
                vscode.window.showInformationMessage('It seems start marker "▼" is gone');
                return Promise.resolve(false);
            }
            // erase candidate
            return replaceRange(candidateRange, '');
        }
        return Promise.resolve(false);
    }

    /**
     * Fixate the candidate shown over the midashigo.
     *
     * This method fixate the range from "▼" to the cursor position, then hide the annotation.
     */
    fixateCandidate(candStr: string | undefined = undefined): PromiseLike<boolean> {
        // Check the first char at the midashigoStart is "▼", then remove it
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return Promise.resolve(false);
        }
        if (!this.midashigoStart) {
            return Promise.resolve(false);
        }
        const firstCharRange = new vscode.Range(this.midashigoStart, this.midashigoStart.translate(0, 1));
        let firstChar = editor.document.getText(firstCharRange);
        if (firstChar !== '▼') {
            vscode.window.showInformationMessage('It seems start marker "▼" is gone');
            return Promise.resolve(false);
        }

        // hide the annotation
        this.showRemainingRomaji("", false);

        // Delete heading marker "▼"
        return replaceRange(firstCharRange, candStr ? candStr : '');
    }


    /**
     * Basically, delete the character just before the cursor.
     * If the cursor is at the position just after the midashigo start marker, and the character is "▽",
     * delete the marker and notify the caller.
     * If the cursor is at the position just after the midashigo start marker, and the character is not "▽",
     * delete the character and notify the caller.
     */
    deleteLeft(): DeleteLeftResult {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.midashigoStart) {
            // Check if the cursor is at the position just after the midashigo start marker, and the character is "▽"
            if (editor.selection.start.character === this.midashigoStart.character + 1) {
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
}