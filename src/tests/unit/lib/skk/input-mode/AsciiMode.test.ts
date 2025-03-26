import { expect } from 'chai';
import { AsciiMode } from '../../../../../lib/skk/input-mode/AsciiMode';
import { MockEditor } from '../../../mocks/MockEditor';

describe('AsciiMode', () => {
    let asciiMode: AsciiMode;
    let mockEditor: MockEditor;

    beforeEach(() => {
        mockEditor = new MockEditor();
        mockEditor.resetInsertedText();  // テストケースごとにinsertedTextをリセット
        asciiMode = AsciiMode.getInstance();
    });

    it('should insert lowercase alphabet as is', () => {
        asciiMode.lowerAlphabetInput('a');
        expect(mockEditor.getInsertedText()).to.equal('a');
    });

    it('should insert uppercase alphabet as is', () => {
        asciiMode.upperAlphabetInput('A');
        expect(mockEditor.getInsertedText()).to.equal('A');
    });

    it('should insert space as is', () => {
        asciiMode.spaceInput();
        expect(mockEditor.getInsertedText()).to.equal(' ');
    });

    it('should insert numbers as is', () => {
        asciiMode.numberInput('1');
        expect(mockEditor.getInsertedText()).to.equal('1');
    });

    it('should insert symbols as is', () => {
        asciiMode.symbolInput('!');
        expect(mockEditor.getInsertedText()).to.equal('!');
    });

    it('should switch to hiragana mode on Ctrl+J', () => {
        asciiMode.ctrlJInput();
        expect(mockEditor.getCurrentInputMode().toString()).to.equal('かな');
    });

    it('should do nothing on Ctrl+G', () => {
        const beforeState = mockEditor.getState();
        asciiMode.ctrlGInput();
        expect(mockEditor.getState()).to.deep.equal(beforeState);
    });
});