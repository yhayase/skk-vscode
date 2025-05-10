import { expect } from 'chai';
import { AsciiMode } from '../../../../../src/lib/skk/input-mode/AsciiMode';
import { MockEditor } from '../../../mocks/MockEditor';
import { EditorFactory } from '../../../../../src/lib/skk/editor/EditorFactory';

describe('AsciiMode', () => {
    let asciiMode: AsciiMode;
    let mockEditor: MockEditor;

    beforeEach(() => {
        mockEditor = new MockEditor();
        // mockEditor.resetInsertedText(); // Assuming MockEditor has this or similar reset
        EditorFactory.setInstance(mockEditor);
        asciiMode = AsciiMode.getInstance();
        // If AsciiMode's constructor or getInstance relies on editor being set in factory,
        // it should be fine. If it takes editor as param, adjust instantiation.
    });

    afterEach(() => {
        EditorFactory.reset();
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
        // Assuming MockEditor has a way to get its full state or relevant parts
        // For simplicity, if ctrlGInput is empty, we might not need a deep state check,
        // but ensure no error is thrown and mode doesn't change unexpectedly.
        // const beforeState = mockEditor.getState(); // If getState exists
        const currentModeBefore = mockEditor.getCurrentInputMode();
        asciiMode.ctrlGInput();
        // expect(mockEditor.getState()).to.deep.equal(beforeState);
        expect(mockEditor.getCurrentInputMode()).to.equal(currentModeBefore); // Mode should not change
        // Also check that no text was inserted/deleted if that's the expectation
        expect(mockEditor.getInsertedText()).to.equal(''); // Assuming resetInsertedText or similar in beforeEach/mock
    });

    it('getActiveKeys should return a set containing only "ctrl+j"', () => {
        const activeKeys = asciiMode.getActiveKeys();
        expect(activeKeys).to.deep.equal(new Set(["ctrl+j"]));
    });
});
