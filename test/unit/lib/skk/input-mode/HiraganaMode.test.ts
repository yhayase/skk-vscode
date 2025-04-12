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

    it('should handle "n" correctly when followed by uppercase letter', async () => {
        mockEditor.getJisyoProvider().registerCandidate('かn', {word: '兼'});
        mockEditor.getJisyoProvider().registerCandidate('かんs', {word: '関'});

        // "kan" を入力
        await hiraganaMode.upperAlphabetInput('K');
        await hiraganaMode.lowerAlphabetInput('a');
        await hiraganaMode.lowerAlphabetInput('n');
        
        // "S" を入力（送り仮名モードに切り替わる）
        await hiraganaMode.upperAlphabetInput('S');
        
        // 「か」が語幹、「ん」が送り仮名とし解釈される欠陥があった。
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
});