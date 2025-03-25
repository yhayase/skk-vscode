import { expect } from 'chai';
import { KatakanaMode } from '../../../input-mode/KatakanaMode';
import { MockEditor } from '../mocks/MockEditor';
import { EditorFactory } from '../../../editor/EditorFactory';

describe('KatakanaMode', () => {
    let katakanaMode: KatakanaMode;
    let mockEditor: MockEditor;

    beforeEach(() => {
        mockEditor = new MockEditor();
        katakanaMode = new KatakanaMode();
    });

    it('should convert romaji to katakana', () => {
        katakanaMode.lowerAlphabetInput('k');
        katakanaMode.lowerAlphabetInput('a');
        expect(mockEditor.getInsertedText()).to.equal('カ');
    });

    it('should handle n+vowel correctly', () => {
        katakanaMode.lowerAlphabetInput('n');
        katakanaMode.lowerAlphabetInput('a');
        expect(mockEditor.getInsertedText()).to.equal('ナ');
    });

    it('should handle n+consonant correctly', () => {
        katakanaMode.lowerAlphabetInput('n');
        katakanaMode.lowerAlphabetInput('k');
        katakanaMode.lowerAlphabetInput('a');
        expect(mockEditor.getCurrentText()).to.equal('ンカ');
    });

    it('should handle double consonants correctly', () => {
        katakanaMode.lowerAlphabetInput('k');
        katakanaMode.lowerAlphabetInput('k');
        katakanaMode.lowerAlphabetInput('a');
        expect(mockEditor.getCurrentText()).to.equal('ッカ');
    });

    it('should start henkan mode with capital letter', () => {
        katakanaMode.upperAlphabetInput('K');
        katakanaMode.lowerAlphabetInput('a');
        katakanaMode.lowerAlphabetInput('t');
        katakanaMode.lowerAlphabetInput('a');
        expect(mockEditor.getMidashigo()).to.equal('カタ');
    });

    it('should switch to hiragana mode on q', () => {
        katakanaMode.lowerAlphabetInput('q');
        expect(mockEditor.getCurrentInputMode().toString()).to.equal('かな');
    });

    it('should switch to ascii mode on l', () => {
        katakanaMode.lowerAlphabetInput('l');
        expect(mockEditor.getCurrentInputMode().constructor.name).to.equal('AsciiMode');
    });
});