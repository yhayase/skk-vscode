import * as vscode from 'vscode';
import { Candidate } from './lib/skk/jisyo/candidate';
import { DeleteLeftResult, IEditor, IRange } from "./lib/skk/editor/IEditor";
import wanakana = require('wanakana');
import { updateCursorMoveTimestamp } from './extension';
import { IInputMode } from './lib/skk/input-mode/IInputMode';
import { AsciiMode } from './lib/skk/input-mode/AsciiMode';
import { IJisyoProvider } from './lib/skk/jisyo/IJisyoProvider';
import { VSCodeJisyoProvider } from './VSCodeJisyoProvider';
import { AbstractKanaMode } from './lib/skk/input-mode/AbstractKanaMode';
import { KakuteiMode } from './lib/skk/input-mode/henkan/KakuteiMode';

import { getActiveKeyContext } from './lib/util/keyUtils'; // Import the utility

export class VSCodeEditor implements IEditor {
    private midashigoStart: vscode.Position | undefined = undefined;
    private static readonly inputModeMap: WeakMap<vscode.TextDocument, IInputMode> = new WeakMap();
    private static readonly registrationModeOrigin: WeakMap<vscode.TextDocument, [VSCodeEditor, vscode.TextDocument, vscode.Position, ]> = new WeakMap();
    private static readonly knownSkkActiveKeys: Set<string> = new Set<string>(); // 追加

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

    private jisyoProvider: IJisyoProvider;
    private okuri: string = "";

    constructor() {
        this.jisyoProvider = new VSCodeJisyoProvider();
    }

    getJisyoProvider(): IJisyoProvider {
        return this.jisyoProvider;
    }

    setMidashigoStartToCurrentPosition(): void {
        this.midashigoStart = vscode.window.activeTextEditor?.selection.start;
    }

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

            this.replaceRange(this.convertToIRange(midashigoRange), converted);
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
                return this.replaceRange(this.convertToIRange(midashigoRange), midashigo.slice(1));
            }
            vscode.window.showInformationMessage('It seems that you have deleted ▽');
            this.midashigoStart = undefined;
        }
        return Promise.resolve(false);
    }

    /**
     * Calculate the range of the midashigo, which is started by "▽" and ended by the cursor position.
     * @returns Range of the midashigo.  If any inconsistency found, returns undefined.
     */
    public calcMidashigoRange(): IRange | undefined {
        if (this.midashigoStart === undefined) {
            vscode.window.showInformationMessage('開始位置が不明です');
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

        return this.convertToIRange(new vscode.Range(this.midashigoStart, editor.selection.end));
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
        if (!midashigoRange) {
            return undefined;
        }
        const vscodeRange = this.convertFromIRange(midashigoRange);
        const midashigo = editor.document.getText(vscodeRange);

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
                return this.replaceRange(this.convertToIRange(midashigoRange), "");
            }
            vscode.window.showInformationMessage('It seems that you have deleted ▽');
            this.midashigoStart = undefined;
        }
        return Promise.resolve(false);
    }

    /**
     * Show henkan candidates over the midashigo.
     * @param candidate The candidate to show
     * @param okuri The okurigana to show after the candidate
     * @param suffix Additional string to show after the candidate. e.g. "、" or "。"
     * @returns Promise that resolves to true if the candidate is shown, false otherwise
     */
    async showCandidate(candidate: Candidate | undefined, okuri: string, suffix: string): Promise<boolean | void> {
        if (this.midashigoStart && vscode.window.activeTextEditor) {
            const midashigoRange = new vscode.Range(this.midashigoStart, vscode.window.activeTextEditor?.selection.end);
            const iMidashigoRange = this.convertToIRange(midashigoRange);

            if (!candidate) {
                const rval = await this.replaceRange(iMidashigoRange, "▼");
                if (rval) {
                    this.showRemainingRomaji(okuri + suffix, false);
                    return true;
                }
                return false;
            }


            if (await this.replaceRange(iMidashigoRange, "▼" + candidate.word)) {
                if (candidate.annotation) {
                    this.showRemainingRomaji(okuri + suffix + "; " + candidate.annotation + ' ', false);
                } else {
                    this.showRemainingRomaji(okuri + suffix, false);
                }
                return true;
            }
            return false;
        }
        // hide the annotation
        this.showRemainingRomaji("", false);
        return false;
    }

    async clearCandidate(): Promise<boolean> {
        this.showRemainingRomaji("", false);
        if (this.midashigoStart && vscode.window.activeTextEditor) {
            const candidateRange = new vscode.Range(this.midashigoStart, vscode.window.activeTextEditor?.selection.end);
            const iCandidateRange = this.convertToIRange(candidateRange);
            // extract string in candidateRange
            let candidate = this.getTextInRange(iCandidateRange);
            // head of candidate must be "▼"
            if (candidate[0] !== '▼') {
                vscode.window.showInformationMessage('It seems start marker "▼" is gone');
                return false;
            }

            // erase candidate
            return await this.replaceRange(iCandidateRange, '');
        }
        return false;
    }

    /**
     * Fixate the candidate shown over the midashigo.
     *
     * This method fixate the range from "▼" to the cursor position, then hide the annotation.
     * @param candStr The string to replace the candidate with. If undefined, the candidate will be removed.
     * @param cusorPosition The position to fixate the candidate. If undefined, the current cursor position will be used.
     */
    async fixateCandidate(candStr: string | undefined = undefined, cusorPosition: vscode.Position | undefined = undefined): Promise<boolean> {
        // Check the first char at the midashigoStart is "▼", then remove it
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return false;
        }
        if (!this.midashigoStart) {
            return false;
        }
        const firstCharRange = new vscode.Range(this.midashigoStart, this.midashigoStart.translate(0, 1));
        const iFirstCharRange = this.convertToIRange(firstCharRange);
        let firstChar = this.getTextInRange(iFirstCharRange);
        if (!['▼', '▽'].includes(firstChar)) {
            vscode.window.showInformationMessage('It seems start marker "▼" is gone');
            return false;
        }

        // hide the annotation
        this.showRemainingRomaji("", false);

        // clear midashigoStart
        this.midashigoStart = undefined;

        // Delete from heading marker "▼"|"▽" to the cursor position
        const range = new vscode.Range(firstCharRange.start, cusorPosition ? cusorPosition : editor.selection.end);
        return await this.replaceRange(range, candStr || '');
    }


    /**
     * Basically, delete the character just before the cursor.
     * If the cursor is at the position just after the midashigo start marker, and the character is "▽",
     * delete the marker and notify the caller.
     * If the cursor is at the position just after the midashigo start marker, and the character is not "▽",
     * delete the character and notify the caller.
     */
    async deleteLeft(): Promise<DeleteLeftResult> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return DeleteLeftResult.noEditor;
        }
        if (!this.midashigoStart) {
            // If midashigoStart is not set, just delete the character before the cursor
            await vscode.commands.executeCommand('deleteLeft');
            return DeleteLeftResult.otherCharacterDeleted;
        }
        // Check if the cursor is at the position just after the midashigo start marker, and the character is "▽"
        if (editor.selection.start.character === this.midashigoStart.character + 1) {
            const charBeforeCursor = editor.document.getText(new vscode.Range(this.midashigoStart, editor.selection.start));
            if (charBeforeCursor === '▽') {
                await vscode.commands.executeCommand('deleteLeft');
                return DeleteLeftResult.markerDeleted;
                // No need to reset romajiInput because it is empty
            } else {
                vscode.window.showInformationMessage('It seems start marker "▽" is gone');
                await vscode.commands.executeCommand('deleteLeft');
                return DeleteLeftResult.markerNotFoundAndOtherCharacterDeleted;
            }
        } else {
            await vscode.commands.executeCommand('deleteLeft');
            return DeleteLeftResult.otherCharacterDeleted;
        }
    }

    // New methods to implement the abstracted interface:

    /**
     * Insert text at current cursor position or replace selected text.
     * @param str Text to insert or replace with
     * @returns Promise that resolves to true if the operation succeeded
     */
    insertOrReplaceSelection(str: string): PromiseLike<boolean> {
        const editor = vscode.window.activeTextEditor;
        let rval: Thenable<boolean> = Promise.resolve(false);
        if (editor) {
            rval = editor.edit(editBuilder => {
                if (editor.selection.isEmpty) {
                    editBuilder.insert(editor.selection.active, str);
                    return;
                } else {
                    editBuilder.replace(editor.selection, str);
                    // clear selection and move cursor to the end of the inserted text
                    editor.selection = new vscode.Selection(editor.selection.active, editor.selection.active);
                }
            });
        }
        updateCursorMoveTimestamp();
        return rval;
    }

    /**
     * Replace text in a specific range.
     * @param range The range to replace
     * @param str The text to replace with
     * @returns Promise that resolves to true if the operation succeeded
     */
    replaceRange(range: IRange, str: string): PromiseLike<boolean> {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const vscodeRange = this.convertFromIRange(range);
            return editor.edit(editBuilder => {
                editBuilder.replace(vscodeRange, str);
            });
        }
        return Promise.resolve(false);
    }

    /**
     * Gets the text from a specific range in the document
     */
    getTextInRange(range: IRange): string {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const vscodeRange = this.convertFromIRange(range);
            return editor.document.getText(vscodeRange);
        }
        return "";
    }

    // Helper methods for converting between VS Code types and our abstraction

    /**
     * Convert a VSCode Range to our IRange
     */
    private convertToIRange(range: vscode.Range): IRange {
        return {
            start: { line: range.start.line, character: range.start.character },
            end: { line: range.end.line, character: range.end.character }
        };
    }

    /**
     * Convert our IRange to a VSCode Range
     */
    private convertFromIRange(range: IRange): vscode.Range {
        return new vscode.Range(
            range.start.line,
            range.start.character,
            range.end.line,
            range.end.character
        );
    }

    showErrorMessage(message: string): void {
        vscode.window.showErrorMessage(message);
    }

    async openRegistrationEditor(yomi: string, okuri: string): Promise<void> {
        this.okuri = okuri;
        const content = `読み:${yomi}\n単語:`;
        const newDoc = await vscode.workspace.openTextDocument({ content, language: 'plaintext' });
        // 新しく開いた辞書登録用のドキュメントが、どのエディタから開かれたものかを記録する
        const origDoc = vscode.window.activeTextEditor?.document;
        if (origDoc) {
            VSCodeEditor.registrationModeOrigin.set(newDoc, [this, origDoc, vscode.window.activeTextEditor!.selection.end]);
        }
        await vscode.window.showTextDocument(newDoc, { preview: false }).then(async (editor) => {
            // move cursor to the end of the document
            await vscode.commands.executeCommand('cursorBottom');
        });
    }

    async registerMidashigo(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const content = document.getText();
        const lines = content.split('\n');

        // Format validation
        if (lines.length < 2 ||
            lines[0].slice(0, 3) !== "読み:" ||
            lines[1].slice(0, 3) !== "単語:" ||
            lines.slice(2).some(line => line.trim() !== '')) {
            this.showErrorMessage("SKK: 辞書登録できません。フォーマットが不正です。");
            return;
        }

        const yomi = lines[0].slice(3);
        const word = lines[1].slice(3);

        if (yomi === '') {
            this.showErrorMessage("SKK: 辞書登録できません。読みが空です。");
            return;
        }

        if (word === '') {
            this.showErrorMessage("SKK: 辞書登録できません。単語が空です。");
            return;
        }

        // Register in user dictionary and save
        this.jisyoProvider.registerCandidate(yomi, { word: word, annotation: undefined });

        // insert the new word to the original editor
        const originalEditorDocCursor = VSCodeEditor.registrationModeOrigin.get(document);
        if (originalEditorDocCursor) {
            const disposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
                const activeTextEditor = vscode.window.activeTextEditor;
                if (!activeTextEditor) {
                    return;
                }

                disposable.dispose();
                if (activeTextEditor.document !== originalEditorDocCursor[1]) {
                    vscode.window.showWarningMessage("SKK: 辞書登録は成功しましたが、元のエディタが見つかりません。");
                }
                // Insert the new word at the current cursor position
                await originalEditorDocCursor[0].fixateCandidate(word + originalEditorDocCursor[0].okuri, originalEditorDocCursor[2]);
                
                // 変換モードを KakuteiMode に戻す
                const currentMode = originalEditorDocCursor[0].getCurrentInputMode();
                if (currentMode instanceof AbstractKanaMode) {
                    currentMode.setHenkanMode(KakuteiMode.create(currentMode, originalEditorDocCursor[0]));
                }
            });
        }



        // Clear editor content
        await editor.edit(editBuilder => {
            const lastLine = document.lineCount - 1;
            const lastChar = document.lineAt(lastLine).text.length;
            editBuilder.delete(new vscode.Range(0, 0, lastLine, lastChar));
        });

        // Close editor
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

    }

    // Input mode management methods
    setInputMode(mode: IInputMode): void {
        mode.reset();
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw Error("No active text editor");
        }
        VSCodeEditor.inputModeMap.set(editor.document, mode);
        this.notifyModeInternalStateChanged(); // Update contexts when mode changes
    }

    getCurrentInputMode(): IInputMode {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw Error("No active text editor");
        }
        let mode = VSCodeEditor.inputModeMap.get(editor.document);
        if (mode === undefined) {
            // Set AsciiMode as the default and trigger context update
            const defaultMode = AsciiMode.getInstance();
            this.setInputMode(defaultMode); // This will call notifyModeInternalStateChanged
            return defaultMode;
        }
        return mode;
    }

    /**
     * SKKキーバインドcontextの洗い替え方式による更新
     * @param editor アクティブなエディタ（undefined可）
     */
    public static async updateSkkContexts(editor: vscode.TextEditor | undefined): Promise<void> {
        let currentMode: IInputMode;
        if (editor && VSCodeEditor.inputModeMap.has(editor.document)) {
            currentMode = VSCodeEditor.inputModeMap.get(editor.document)!;
        } else {
            currentMode = AsciiMode.getInstance();
        }

        const modeName = currentMode.getContextualName();
        const activeKeys = currentMode.getActiveKeys();

        // skk.mode contextを更新
        await vscode.commands.executeCommand('setContext', 'skk.mode', modeName);

        // 既知の全キーについて、activeでなければfalseに
        for (const knownKey of VSCodeEditor.knownSkkActiveKeys) {
            if (!activeKeys.has(knownKey)) {
                await vscode.commands.executeCommand('setContext', getActiveKeyContext(knownKey), false);
            }
        }
        // 現在activeなキーはtrueにし、knownSkkActiveKeysに追加
        for (const newKey of activeKeys) {
            await vscode.commands.executeCommand('setContext', getActiveKeyContext(newKey), true);
            VSCodeEditor.knownSkkActiveKeys.add(newKey);
        }
    }

    // Implementation for IEditor
    public async notifyModeInternalStateChanged(): Promise<void> {
        // staticなupdateSkkContextsを呼ぶ
        VSCodeEditor.updateSkkContexts(vscode.window.activeTextEditor).catch(err => {
            console.error("SKK: Failed to update contexts", err);
        });
    }
}
