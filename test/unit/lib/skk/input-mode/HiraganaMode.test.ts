import { expect } from 'chai';
import { HiraganaMode } from '../../../../../src/lib/skk/input-mode/HiraganaMode';
import { MockEditor } from '../../../mocks/MockEditor';
import { MidashigoMode, MidashigoType } from '../../../../../src/lib/skk/input-mode/henkan/MidashigoMode';
import { EditorFactory } from '../../../../../src/lib/skk/editor/EditorFactory';
import { KakuteiMode } from '../../../../../src/lib/skk/input-mode/henkan/KakuteiMode';
import { AbstractKanaMode } from '../../../../../src/lib/skk/input-mode/AbstractKanaMode';

describe('HiraganaMode', () => {
    let hiraganaMode: HiraganaMode;
    let mockEditor: MockEditor;

    beforeEach(() => {
        mockEditor = new MockEditor();
        EditorFactory.setInstance(mockEditor); // Setup EditorFactory for modes that use it
        hiraganaMode = HiraganaMode.getInstance(); // Use getInstance as per class design
        // AbstractKanaMode constructor calls this.editor.setInputMode,
        // but HiraganaMode itself doesn't directly call setInputMode on mockEditor in its constructor.
        // If direct setInputMode is needed for mockEditor state, it should be explicit.
        // For now, assume HiraganaMode correctly initializes its internal editor via EditorFactory.
    });

    afterEach(() => {
        EditorFactory.reset(); // Clean up EditorFactory
    });

    it('should convert romaji to hiragana', () => {
        hiraganaMode.lowerAlphabetInput('k');
        hiraganaMode.lowerAlphabetInput('a');
        expect(mockEditor.getInsertedText()).to.equal('か');
    });

    it('should handle n+vowel correctly', () => {
        hiraganaMode.lowerAlphabetInput('n');
        hiraganaMode.lowerAlphabetInput('a');
        expect(mockEditor.getInsertedText()).to.equal('な');
    });

    it('should handle n+consonant correctly', () => {
        hiraganaMode.lowerAlphabetInput('n');
        hiraganaMode.lowerAlphabetInput('k');
        hiraganaMode.lowerAlphabetInput('a');
        expect(mockEditor.getCurrentText()).to.equal('んか');
    });

    it('should handle double consonants correctly', () => {
        hiraganaMode.lowerAlphabetInput('k');
        hiraganaMode.lowerAlphabetInput('k');
        hiraganaMode.lowerAlphabetInput('a');
        expect(mockEditor.getCurrentText()).to.equal('っか');
    });

    it('should start henkan mode with capital letter', () => {
        hiraganaMode.upperAlphabetInput('K');
        hiraganaMode.lowerAlphabetInput('a');
        hiraganaMode.lowerAlphabetInput('n');
        hiraganaMode.lowerAlphabetInput('j');
        hiraganaMode.lowerAlphabetInput('i');
        expect(mockEditor.getMidashigo()).to.equal('かんじ');
    });

    it('should switch to katakana mode on q', () => {
        hiraganaMode.lowerAlphabetInput('q');
        expect(mockEditor.getCurrentInputMode().toString()).to.equal('カナ');
    });

    it('should switch to ascii mode on l', () => {
        hiraganaMode.lowerAlphabetInput('l');
        expect(mockEditor.getCurrentInputMode().constructor.name).to.equal('AsciiMode');
    });

    describe('Integration test: Unfixed n followed by uppercase letter', () => {
        it('should handle "n" correctly in MidashigoMode when followed by uppercase consonant', async () => {
            mockEditor.getJisyoProvider().registerCandidate('かn', { word: '兼' });
            mockEditor.getJisyoProvider().registerCandidate('かんs', { word: '関' });

            // "kan" を入力
            await hiraganaMode.upperAlphabetInput('K');
            await hiraganaMode.lowerAlphabetInput('a');
            await hiraganaMode.lowerAlphabetInput('n');

            // "S" を入力（送り仮名モードに切り替わる）
            await hiraganaMode.upperAlphabetInput('S');

            // 「か」が語幹、「ん」が送り仮名として解釈される欠陥があった。
            // 本来はこの時点ではまだ MidashigoMode であり、「かん」が語幹、「s」が入力途中の送り仮名となっている
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('▽かん'); // 「s」はannotationとして表示される

            // "u" を入力（送り仮名として）
            await hiraganaMode.lowerAlphabetInput('u');

            expect(mockEditor.getCurrentText()).to.equal('▼関'); // 「す」はannotationとして表示される
            expect(mockEditor.getAppendedSuffix()).to.equal('す');
            // 変換が行われていることを確認
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('InlineHenkanMode');
        });

        it('should handle "n" correctly in MidashigoMode when followed by uppercase vowel', async () => {
            mockEditor.getJisyoProvider().registerCandidate('かn', { word: '兼' });
            mockEditor.getJisyoProvider().registerCandidate('かんe', { word: '缶' });

            // "kan" を入力
            await hiraganaMode.upperAlphabetInput('K');
            await hiraganaMode.lowerAlphabetInput('a');
            await hiraganaMode.lowerAlphabetInput('n');
            // "E" を入力（送り仮名モードに切り替わる）
            await hiraganaMode.upperAlphabetInput('E');
            // 「か」が語幹、「ね」が送り仮名として解釈される欠陥があった。
            // 本来は「かん」が語幹、「え」が送り仮名として変換が開始される
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('InlineHenkanMode');
            expect(mockEditor.getCurrentText()).to.equal('▼缶'); // 「え」は送り仮名として表示される
            expect(mockEditor.getAppendedSuffix()).to.equal('え');
        });

        it('should handle consonant correctly in KakuteiMode when followed by uppercase vowel', async () => {
            await hiraganaMode.lowerAlphabetInput('k');
            await hiraganaMode.upperAlphabetInput('A');

            // 「k」が捨てられて、「あ」だけで見出し語モードが開始する欠陥があった。
            // 正しくは、「か」で見出し語モードが開始する
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('▽か');
        });

        it('should handle consonant correctly in KakuteiMode when followed by same uppercase consonant', async () => {
            await hiraganaMode.lowerAlphabetInput('s');
            await hiraganaMode.upperAlphabetInput('S');

            // 最初の「s」が捨てられて、2つ目の「s」だけで見出し語モードが開始する欠陥があった。
            // 「っ」と未確定の「s」で見出し語モードが開始する
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('▽っ');
            expect(mockEditor.getRemainingRomaji()).to.equal('s');
        });

        it('should handle "n" correctly in KakuteiMode when followed by uppercase vowel', async () => {
            await hiraganaMode.lowerAlphabetInput('n');
            await hiraganaMode.upperAlphabetInput('I');

            // 他の子音と異なり、 n に続いて母音が入力された場合は、「ん」が確定して、母音のみで見出し語モードが開始しなければならない。
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('ん▽い');
        });

        it('should handle "n" correctly in KakuteiMode when followed by other uppercase consonant', async () => {
            await hiraganaMode.lowerAlphabetInput('n');
            await hiraganaMode.upperAlphabetInput('K');

            // 「ん」が捨てられて、「か」で見出し語モードが開始する欠陥があった。
            // 正しくは、「ん」と未確定の「k」で見出し語モードが開始する
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('ん▽');
            expect(mockEditor.getRemainingRomaji()).to.equal('k');
        });

        it('should handle "n" correctly in KakuteiMode when followed by uppercase N', async () => {
            await hiraganaMode.lowerAlphabetInput('n');
            await hiraganaMode.upperAlphabetInput('N');

            // 「ん」が捨てられて、「n」で見出し語モードが開始する欠陥があった。
            // 正しくは、「ん」と未確定の「n」で見出し語モードが開始する
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('ん▽');
            expect(mockEditor.getRemainingRomaji()).to.equal('n');
        });
    });

    describe('Integration test: Returning to MidashigoMode from okuri-ari midashigo conversion', () => {
        it('should be in gokan mode when returning from okuri-ari midashigo conversion', async () => {
            mockEditor.getJisyoProvider().registerCandidate('あu', { word: '合' });

            // "AU" を入力して InlineHenkanMode に遷移
            await hiraganaMode.upperAlphabetInput('A');
            await hiraganaMode.upperAlphabetInput('U');

            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('InlineHenkanMode');

            // x を入力して MidashigoMode に戻る
            await hiraganaMode.lowerAlphabetInput('x');
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');

            // DDSKK 互換の振舞いとして、送り仮名は語幹に追加される
            expect(mockEditor.getCurrentText()).to.equal('▽あう');

            // midashigoMode は gokan でなければならない
            expect((hiraganaMode["henkanMode"] as MidashigoMode)["midashigoMode"]).to.equal(MidashigoType.gokan, 'should be in gokan mode');
        });
    });

    describe('getActiveKeys', () => {
        it('should return keys from KakuteiMode plus "q" when henkanMode is KakuteiMode (default state)', () => {
            // HiraganaMode initializes with KakuteiMode internally
            const kakuteiMode = new KakuteiMode(hiraganaMode as AbstractKanaMode, mockEditor);
            const expectedKeysFromKakutei = kakuteiMode.getActiveKeys();
            const expectedKeys = new Set(expectedKeysFromKakutei);
            expectedKeys.add("q"); // AbstractKanaMode adds 'q'

            const activeKeys = hiraganaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });

        it('should include basic romaji input keys when in default (KakuteiMode) state', () => {
            const activeKeys = hiraganaMode.getActiveKeys();
            // Check for a few representative keys from KakuteiMode's expected set
            expect(activeKeys.has('a'), "key 'a'").to.be.true;
            expect(activeKeys.has('shift+a'), "key 'shift+a'").to.be.true;
            expect(activeKeys.has('1'), "key '1'").to.be.true;
            expect(activeKeys.has('/'), "key '/'").to.be.true;
            expect(activeKeys.has('space'), "key 'space'").to.be.true;
            expect(activeKeys.has('enter'), "key 'enter'").to.be.true;
            expect(activeKeys.has('backspace'), "key 'backspace'").to.be.true;
            expect(activeKeys.has('ctrl+j'), "key 'ctrl+j'").to.be.true;
            expect(activeKeys.has('ctrl+g'), "key 'ctrl+g'").to.be.true;
            expect(activeKeys.has('q'), "key 'q' (added by AbstractKanaMode)").to.be.true;
        });

        // TODO: Add tests for getActiveKeys when HiraganaMode is in other internal henkan states
        // (e.g., MidashigoMode, InlineHenkanMode) once those modes also implement getActiveKeys.
    });
});
