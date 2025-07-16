import * as wanakana from 'wanakana';
import { DeleteLeftResult, IEditor, IPosition, IRange } from '../../../src/lib/skk/editor/IEditor';
import { IJisyoProvider } from '../../../src/lib/skk/jisyo/IJisyoProvider';
import { Candidate } from '../../../src/lib/skk/jisyo/candidate';
import { Entry } from '../../../src/lib/skk/jisyo/entry';
import { IInputMode } from '../../../src/lib/skk/input-mode/IInputMode';
import { AbstractHenkanMode } from '../../../src/lib/skk/input-mode/henkan/AbstractHenkanMode';
import { EditorFactory } from '../../../src/lib/skk/editor/EditorFactory';
import { HiraganaMode } from '../../../src/lib/skk/input-mode/HiraganaMode';

/**
 * Utility function to find the index of a position in a string for internal use
 * @param str The string to search in
 * @param pos The position to find
 * @returns The index of the position in the string or undefined if not found
 */
function indexOfPositionInString(str: string, pos: IPosition): number | undefined {
    function positionOfNthOccurence(str: string, searchStr: string, n: number): number | undefined {
        if (n < 0) {
            return undefined;
        }
        if (n === 0) {
            return -1;
        }

        let index = -searchStr.length;

        for (let count = 0; count < n; count++) {
            index = str.indexOf(searchStr, index + searchStr.length);
            if (index === -1) {
                return undefined;
            }
        }

        return index;
    }

    if (pos.line === 0 && pos.character === 0) {
        return 0;
    }

    const lastLineEndIndex = positionOfNthOccurence(str, '\n', pos.line);
    if (lastLineEndIndex === undefined) {
        return undefined;
    }
    // check if str[lastLineEndIndex+1 .. lastLineEndIndex+1+pos.character] is valid
    const strSlice = str.slice(lastLineEndIndex + 1, lastLineEndIndex + 1 + pos.character);
    if (strSlice.length !== pos.character || strSlice.includes('\n')) {
        return undefined;
    }
    return lastLineEndIndex + 1 + pos.character;
}


/**
 * Mock implementation of IJisyoProvider for testing
 */
export class MockJisyoProvider implements IJisyoProvider {
    private dictionary: Map<string, Candidate[]> = new Map();

    /**
     * Lookup candidates for a given key
     * @param key The dictionary key to look up
     * @returns Array of candidates or undefined if none found
     */
    async lookupCandidates(key: string): Promise<Entry | undefined> {
        const candidates = this.dictionary.get(key);
        if (!candidates || candidates.length === 0) {
            return undefined;
        }
        return new Entry(key, candidates, "");
    }

    /**
     * Register a new candidate for a given key
     * @param key The key to register the candidate under
     * @param candidate The candidate to register
     * @returns True if registration was successful
     */
    async registerCandidate(key: string, candidate: Candidate): Promise<boolean> {
        if (!this.dictionary.has(key)) {
            this.dictionary.set(key, [candidate]);
        } else {
            const candidates = this.dictionary.get(key)!;
            // Check if candidate already exists
            if (!candidates.some(c => c.word === candidate.word)) {
                candidates.unshift(candidate);
            }
        }
        return true;
    }

    /**
     * Reorder candidates for a key by moving a candidate at a specific index to the front
     * @param key The key whose candidates should be reordered
     * @param selectedIndex The index of the selected candidate that should be moved to front
     * @returns True if reordering was successful
     */
    async reorderCandidate(key: string, selectedIndex: number): Promise<boolean> {
        const candidates = this.dictionary.get(key);
        if (!candidates || selectedIndex >= candidates.length || selectedIndex < 0) {
            return false;
        }

        const selected = candidates.splice(selectedIndex, 1)[0];
        candidates.unshift(selected);
        return true;
    }

    /**
     * Delete a candidate from the dictionary
     * @param key The key of the candidate
     * @param candidate The candidate to delete
     * @returns True if deletion was successful
     */
    async deleteCandidate(key: string, candidate: Candidate): Promise<boolean> {
        const candidates = this.dictionary.get(key);
        if (!candidates) {
            return false;
        }

        const index = candidates.findIndex(c => c.word === candidate.word);
        if (index === -1) {
            return false;
        }

        candidates.splice(index, 1);
        if (candidates.length === 0) {
            this.dictionary.delete(key);
        }
        return true;
    }
}

export class MockEditor implements IEditor {
    private insertedText: string = '';
    private currentInputMode: IInputMode;
    private midashigoText: string = '';
    private currentCandidate?: Candidate;
    private candidateList: { candidates: Candidate[], selectionKeys: string[] } = { candidates: [], selectionKeys: [] };
    private wasDeleteLeftInvoked: boolean = false;
    private henkanMode: AbstractHenkanMode | null = null;
    private remainingRomaji: string = '';
    private isOkuriState: boolean = false;
    private fixatedCandidate: string = '';
    private wasRegistrationEditorOpened_: boolean = false;
    private lastErrorMessage: string = '';
    private currentText: string = '';
    private cursorPosition: IPosition = { line: 0, character: 0 };
    private midashigoStartPosition: IPosition | null = null;
    private appendedSuffix: string = '';
    private jisyoProvider: IJisyoProvider;
    private registrationYomi: string|undefined = undefined;

    // 追加: テスト用のセッター
    public setCurrentText(text: string): void {
        this.currentText = text;
    }

    public setCursorPosition(position: IPosition): void {
        this.cursorPosition = position;
    }

    constructor() {
        // まずEditorFactoryを初期化
        EditorFactory.setInstance(this);
        this.jisyoProvider = new MockJisyoProvider();
        this.currentInputMode = new HiraganaMode();
    }

    // Helper methods for tests
    getInsertedText(): string {
        return this.insertedText;
    }

    getCurrentInputMode(): IInputMode {
        return this.currentInputMode;
    }

    getMidashigo(): string {
        return this.midashigoText;
    }

    getCurrentCandidate(): Candidate | undefined {
        return this.currentCandidate;
    }

    getCandidateList() {
        return this.candidateList;
    }

    getAppendedSuffix(): string {
        return this.appendedSuffix;
    }

    wasDeleteLeftCalled(): boolean {
        return this.wasDeleteLeftInvoked;
    }


    getRemainingRomaji(): string {
        return this.remainingRomaji;
    }

    isOkuriStateActive(): boolean {
        return this.isOkuriState;
    }

    getFixatedCandidate(): string {
        return this.fixatedCandidate;
    }

    wasRegistrationEditorOpened(): boolean {
        return this.wasRegistrationEditorOpened_;
    }

    getLastErrorMessage(): string {
        return this.lastErrorMessage;
    }

    getCursorPosition(): IPosition {
        return this.cursorPosition;
    }

    getCurrentText(): string {
        return this.currentText;
    }

    getState() {
        return {
            insertedText: this.insertedText,
            currentInputMode: this.currentInputMode,
            midashigoText: this.midashigoText,
            currentCandidate: this.currentCandidate,
            candidateList: this.candidateList,
            wasDeleteLeftInvoked: this.wasDeleteLeftInvoked,
            henkanMode: this.henkanMode,
            remainingRomaji: this.remainingRomaji,
            isOkuriState: this.isOkuriState,
            fixatedCandidate: this.fixatedCandidate,
            currentText: this.currentText,
            cursorPosition: this.cursorPosition,
            midashigoStartPosition: this.midashigoStartPosition,
            appendedSuffix: this.appendedSuffix
        };
    }

    // IEditor interface implementation
    async deleteLeft(): Promise<DeleteLeftResult> {
        this.wasDeleteLeftInvoked = true;

        const cursorIndexInCurrentText = indexOfPositionInString(this.currentText, this.cursorPosition);
        if (cursorIndexInCurrentText === undefined) {
            throw new Error('Invalid cursor position');
        }
        if (cursorIndexInCurrentText === 0) {
            // No need to delete since cursor is at the beginning of the text.
            return DeleteLeftResult.otherCharacterDeleted;
        }

        let rval = DeleteLeftResult.otherCharacterDeleted;
        if (this.midashigoStartPosition !== null) {
            const markerIndexInCurrentText = indexOfPositionInString(this.currentText, this.midashigoStartPosition);
            if (markerIndexInCurrentText === undefined) {
                throw new Error('Invalid marker position');
            }

            if (markerIndexInCurrentText === cursorIndexInCurrentText - 1) {
                const charToDelete = this.currentText.charAt(cursorIndexInCurrentText - 1);
                if (charToDelete !== '▽') {
                    rval = DeleteLeftResult.markerNotFoundAndOtherCharacterDeleted;
                } else {
                    rval = DeleteLeftResult.markerDeleted;
                }
            }
        }

        // delete the character at left of the cursor
        this.currentText = this.currentText.slice(0, cursorIndexInCurrentText - 1) +
            this.currentText.slice(cursorIndexInCurrentText);
        this.cursorPosition.character--; // BUG: if character is 0, it will be -1
        this.midashigoStartPosition = null;
        this.midashigoText = '';
        this.currentCandidate = undefined;

        return rval;
    }

    async fixateCandidate(candStr: string | undefined): Promise<boolean> {
        // VSCodeEditor の実装
        /*
                // Check the first char at the midashigoStart is "▼", then remove it
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    return Promise.resolve(false);
                }
                if (!this.midashigoStart) {
                    return Promise.resolve(false);
                }
                const firstCharRange = new vscode.Range(this.midashigoStart, this.midashigoStart.translate(0, 1));
                const iFirstCharRange = this.convertToIRange(firstCharRange);
                let firstChar = this.getTextInRange(iFirstCharRange);
                if (firstChar !== '▼') {
                    vscode.window.showInformationMessage('It seems start marker "▼" is gone');
                    return Promise.resolve(false);
                }
        
                // hide the annotation
                this.showRemainingRomaji("", false);
        
                // clear midashigoStart
                this.midashigoStart = undefined;
        
                // Delete heading marker "▼"
                return this.replaceRange(iFirstCharRange, candStr ? candStr : '');
        */
        // Mock implementation
        if (this.midashigoStartPosition) {
            const startIndexInCurrentText = indexOfPositionInString(this.currentText, this.midashigoStartPosition);
            if (startIndexInCurrentText === undefined) {
                return false;
            }
            const endIndexInCurrentText = indexOfPositionInString(this.currentText, this.cursorPosition);
            if (endIndexInCurrentText === undefined) {
                return false;
            }

            if (this.currentText.charAt(startIndexInCurrentText) !== '▼') {
                return false;
            }
            this.fixatedCandidate = candStr || this.currentText.slice(startIndexInCurrentText + 1, endIndexInCurrentText);

            // replace startIndexInCurrentText to endIndexInCurrentText with fixatedCandidate
            this.currentText = this.currentText.slice(0, startIndexInCurrentText) +
                this.fixatedCandidate +
                this.currentText.slice(endIndexInCurrentText);
            this.cursorPosition.character = startIndexInCurrentText + this.fixatedCandidate.length;

            this.midashigoStartPosition = null;
            this.midashigoText = '';
            this.currentCandidate = undefined;
            this.appendedSuffix = '';
            this.remainingRomaji = '';

            return true;
        }
        return false;
    }

    async clearCandidate(): Promise<boolean> {
        if (this.midashigoStartPosition) {
            const startIndexInCurrentText = indexOfPositionInString(this.currentText, this.midashigoStartPosition);
            if (startIndexInCurrentText === undefined) {
                return false;
            }

            const endIndexInCurrentText = indexOfPositionInString(this.currentText, this.cursorPosition);
            if (endIndexInCurrentText === undefined) {
                return false;
            }

            if (startIndexInCurrentText > endIndexInCurrentText) {
                return false;
            }
            const head = this.currentText.slice(0, startIndexInCurrentText);
            const tail = this.currentText.slice(endIndexInCurrentText);
            this.currentText = head + tail;
            this.cursorPosition = this.midashigoStartPosition;
        }
        this.midashigoStartPosition = null;
        this.midashigoText = '';
        this.currentCandidate = undefined;
        this.appendedSuffix = '';
        return true;
    }

    showCandidate(candidate: Candidate | undefined, suffix: string): PromiseLike<boolean | void> {
        this.currentCandidate = candidate;
        this.appendedSuffix = suffix;
        if (candidate) {
            // 候補を表示する際にカーソル位置も更新
            const text = '▼' + candidate.word; // suffix はエディタのテキストとしては表示せず、インラインのアノテーションとして表示する
            if (this.midashigoStartPosition) {
                this.currentText = this.currentText.slice(0, this.midashigoStartPosition.character) +
                    text +
                    this.currentText.slice(this.cursorPosition.character);
                this.cursorPosition.character = this.midashigoStartPosition.character + text.length;
            }
        }
        return Promise.resolve(true);
    }

    // FIXME: 正しい実装がない
    toggleCharTypeInMidashigoAndFixateMidashigo(): void {
        const midashigo = this.extractMidashigo();
        if (midashigo) {
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

            this.replaceCurrentMidashigo(converted);
            this.midashigoStartPosition = null;
            this.cursorPosition.character = this.cursorPosition.character - 1; // BUG: if character is 0, it will be -1
        }
    }

    clearMidashigo(): PromiseLike<boolean> {
        if (this.midashigoStartPosition) {
            this.currentText = this.currentText.slice(0, this.midashigoStartPosition.character);
            this.cursorPosition = { ...this.midashigoStartPosition };
            this.midashigoStartPosition = null;
            this.midashigoText = '';
            this.currentCandidate = undefined;
        }
        return Promise.resolve(true);
    }

    extractMidashigo(): string | undefined {
        if (!this.midashigoStartPosition) {
            return undefined;
        }
        const start = this.midashigoStartPosition.character;
        const end = this.cursorPosition.character;
        const text = this.currentText.slice(start, end);
        if (text[0] === '▽') {
            return text.slice(1);
        }
        return undefined;
    }

    calcMidashigoRange(): IRange | undefined {
        if (!this.midashigoStartPosition) {
            return undefined;
        }
        return {
            start: this.midashigoStartPosition,
            end: this.cursorPosition
        };
    }

    async fixateMidashigo(): Promise<boolean> {
        const midashigo = this.extractMidashigo();
        if (midashigo) {
            this.replaceCurrentMidashigo(midashigo);
            this.midashigoStartPosition = null;
            return true;
        }
        return false;
    }

    setMidashigoStartToCurrentPosition(): void {
        this.midashigoStartPosition = { ...this.cursorPosition };
    }

    hideCandidateList(): void {
        this.candidateList = { candidates: [], selectionKeys: [] };
    }

    showCandidateList(candidateList: Candidate[], alphabetList: string[]): void {
        this.candidateList = {
            candidates: candidateList,
            selectionKeys: alphabetList
        };
    }

    showRemainingRomaji(remainingRomaji: string, isOkuri: boolean, offset: number): void {
        this.remainingRomaji = remainingRomaji;
        this.isOkuriState = isOkuri;
    }

    async insertOrReplaceSelection(str: string): Promise<boolean> {
        this.insertedText = str;
        this.currentText = this.currentText.slice(0, this.cursorPosition.character) +
            str +
            this.currentText.slice(this.cursorPosition.character);
        this.cursorPosition.character += str.length;

        // 見出し語の更新
        if (this.midashigoStartPosition) {
            const start = this.midashigoStartPosition.character;
            const end = this.cursorPosition.character;
            const text = this.currentText.slice(start, end);
            if (text[0] === '▽') {
                this.midashigoText = text.slice(1);
            }
        }

        return true;
    }

    // Helper method for tests - reset inserted text
    resetInsertedText(): void {
        this.insertedText = '';
    }

    async replaceRange(range: IRange, str: string): Promise<boolean> {
        this.insertedText = str;
        this.currentText = this.currentText.slice(0, range.start.character) +
            str +
            this.currentText.slice(range.end.character);
        this.cursorPosition.character = range.start.character + str.length;
        return true;
    }

    getTextInRange(range: IRange): string {
        return this.currentText.slice(range.start.character, range.end.character);
    }

    async openRegistrationEditor(yomi: string): Promise<void> {
        this.wasRegistrationEditorOpened_ = true;
        this.registrationYomi = yomi;
    }

    getRegistrationYomi(): string | undefined {
        return this.registrationYomi;
    }

    async registerMidashigo(): Promise<void> {
        // 登録処理のシミュレーション
    }

    showErrorMessage(message: string): void {
        this.lastErrorMessage = message;
    }

    setInputMode(mode: IInputMode): void {
        this.currentInputMode = mode;
        // モード切り替え時に必要に応じて状態をクリア
        if (this.henkanMode) {
            this.henkanMode = null;
            this.currentCandidate = undefined;
        }
    }

    getJisyoProvider(): IJisyoProvider {
        return this.jisyoProvider;
    }

    private replaceCurrentMidashigo(text: string): void {
        if (this.midashigoStartPosition) {
            const suffix = this.appendedSuffix || '';
            const fullText = text + suffix;
            this.currentText = this.currentText.slice(0, this.midashigoStartPosition.character) +
                fullText +
                this.currentText.slice(this.cursorPosition.character);
            this.cursorPosition.character = this.midashigoStartPosition.character + fullText.length;
            this.midashigoStartPosition = null;
            this.midashigoText = '';
            this.currentCandidate = undefined;
        }
    }

    async notifyModeInternalStateChanged(): Promise<void> {
        // console.log(`MockEditor.notifyModeInternalStateChanged`);
        // This is a mock, so typically no action is needed unless a test
        // specifically wants to verify this call or its side effects.
        return Promise.resolve();
    }
}
