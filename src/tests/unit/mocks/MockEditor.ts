import { Candidate } from '../../../jisyo/candidate';
import { DeleteLeftResult, IEditor, IPosition, IRange } from '../../../editor/IEditor';
import { IInputMode } from '../../../input-mode/IInputMode';
import { HiraganaMode } from '../../../input-mode/HiraganaMode';
import { AbstractHenkanMode } from '../../../input-mode/henkan/AbstractHenkanMode';
import { IJisyoProvider } from '../../../jisyo/IJisyoProvider';
import { Entry } from '../../../jisyo/entry';
import { EditorFactory } from '../../../editor/EditorFactory';

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

    wasDeleteLeftCalled(): boolean {
        return this.wasDeleteLeftInvoked;
    }

    getHenkanMode(): AbstractHenkanMode {
        return this.henkanMode!;
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

    setHenkanMode(mode: AbstractHenkanMode): void {
        this.henkanMode = mode;
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
        if (this.cursorPosition.character > 0) {
            if (this.midashigoStartPosition &&
                this.cursorPosition.character === this.midashigoStartPosition.character + 1) {
                const char = this.currentText[this.cursorPosition.character - 1];
                if (char === '▽') {
                    this.midashigoStartPosition = null;
                    this.currentText = this.currentText.slice(0, -1);
                    this.cursorPosition.character--;
                    return DeleteLeftResult.markerDeleted;
                }
                return DeleteLeftResult.markerNotFoundAndOtherCharacterDeleted;
            }
            this.currentText = this.currentText.slice(0, -1);
            this.cursorPosition.character--;
            return DeleteLeftResult.otherCharacterDeleted;
        }
        return DeleteLeftResult.noEditor;
    }

    async fixateCandidate(candStr: string | undefined): Promise<boolean> {
        this.fixatedCandidate = candStr || '';
        if (candStr) {
            this.replaceCurrentMidashigo(candStr);
            // 確定時には見出し語をクリア
            this.midashigoText = '';
        }
        this.midashigoStartPosition = null;
        return true;
    }

    async clearCandidate(): Promise<boolean> {
        this.currentCandidate = undefined;
        this.henkanMode = null;
        return true;
    }

    showCandidate(candidate: Candidate | undefined, suffix: string): PromiseLike<boolean | void> {
        this.currentCandidate = candidate;
        this.appendedSuffix = suffix;
        if (candidate) {
            // 候補を表示する際にカーソル位置も更新
            const text = '▼' + candidate.word + (suffix || '');
            if (this.midashigoStartPosition) {
                this.currentText = this.currentText.slice(0, this.midashigoStartPosition.character) +
                    text +
                    this.currentText.slice(this.cursorPosition.character);
                this.cursorPosition.character = this.midashigoStartPosition.character + text.length;
            }
        }
        return Promise.resolve(true);
    }

    toggleCharTypeInMidashigoAndFixateMidashigo(): void {
        const midashigo = this.extractMidashigo();
        if (midashigo) {
            // 簡易的な実装: ひらがなとカタカナの変換のみ
            this.fixatedCandidate = midashigo;
            this.midashigoStartPosition = null;
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
}