import { expect } from 'chai';
import { ZeneiMode } from '../../../../../src/lib/skk/input-mode/ZeneiMode';
import { MockEditor } from '../../../mocks/MockEditor';
import { EditorFactory } from '../../../../../src/lib/skk/editor/EditorFactory';

describe('ZeneiMode', () => {
    let zeneiMode: ZeneiMode;
    let mockEditor: MockEditor;

    beforeEach(() => {
        mockEditor = new MockEditor();
        EditorFactory.setInstance(mockEditor);
        zeneiMode = ZeneiMode.getInstance();
        mockEditor.setInputMode(zeneiMode);
    });

    afterEach(() => {
        EditorFactory.reset();
        (ZeneiMode as any).instance = undefined; // Reset the singleton instance
    });

    it('should convert lowercase alphabet to zenkaku', () => {
        zeneiMode.lowerAlphabetInput('a');
        expect(mockEditor.getInsertedText()).to.equal('ａ');
    });

    it('should convert uppercase alphabet to zenkaku', () => {
        zeneiMode.upperAlphabetInput('A');
        expect(mockEditor.getInsertedText()).to.equal('Ａ');
    });

    it('should convert space to zenkaku', () => {
        zeneiMode.spaceInput();
        expect(mockEditor.getInsertedText()).to.equal('　');
    });

    it('should convert numbers to zenkaku', () => {
        zeneiMode.numberInput('1');
        expect(mockEditor.getInsertedText()).to.equal('１');
    });

    it('should convert symbols to zenkaku', () => {
        zeneiMode.symbolInput('!');
        expect(mockEditor.getInsertedText()).to.equal('！');
    });

    it('should switch to hiragana mode on Ctrl+J', () => {
        zeneiMode.ctrlJInput();
        expect(mockEditor.getCurrentInputMode().toString()).to.equal('かな');
    });

    it('should do nothing on Ctrl+G', () => {
        const beforeState = mockEditor.getState();
        zeneiMode.ctrlGInput();
        expect(mockEditor.getState()).to.deep.equal(beforeState);
    });

    it('should handle multiple character conversion correctly', () => {
        const result = ZeneiMode.convertToZenkakuEisuu('Hello123!');
        expect(result).to.equal('Ｈｅｌｌｏ１２３！');
    });

    it('getActiveKeys should return a set containing all printable ASCII and "ctrl+j"', () => {
        const activeKeys = zeneiMode.getActiveKeys();
        const expectedKeys = new Set<string>();
        for (let i = 32; i <= 126; i++) {
            const char = String.fromCharCode(i);
            if ('a' <= char && char <= 'z') {
                expectedKeys.add(char);
                expectedKeys.add(`shift+${char}`);
            } else if ('A' <= char && char <= 'Z') {
                // Covered by shift+lowercase
            } else {
                expectedKeys.add(char);
            }
        }
        expectedKeys.add("ctrl+j");

        expect(activeKeys).to.deep.equal(expectedKeys);
    });

    it('getContextualName should return "zenei"', () => {
        expect(zeneiMode.getContextualName()).to.equal("zenei");
    });
});
