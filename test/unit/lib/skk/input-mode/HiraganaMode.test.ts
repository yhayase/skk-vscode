import { expect } from 'chai';
import { HiraganaMode } from '../../../../../src/lib/skk/input-mode/HiraganaMode';
import { MockEditor } from '../../../mocks/MockEditor';

describe('HiraganaMode', () => {
    let hiraganaMode: HiraganaMode;
    let mockEditor: MockEditor;

    beforeEach(() => {
        mockEditor = new MockEditor();
        hiraganaMode = new HiraganaMode();
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
});