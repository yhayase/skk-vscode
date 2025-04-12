import { expect } from 'chai';
import { HiraganaMode } from '../../../../../src/lib/skk/input-mode/HiraganaMode';
import { MockEditor } from '../../../mocks/MockEditor';

describe('HiraganaMode', () => {
    let hiraganaMode: HiraganaMode;
    let mockEditor: MockEditor;

    beforeEach(() => {
        mockEditor = new MockEditor();
        hiraganaMode = new HiraganaMode();
        mockEditor.setInputMode(hiraganaMode);
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

    describe('Unfixed n followd by uppercase letter', () => {
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
});