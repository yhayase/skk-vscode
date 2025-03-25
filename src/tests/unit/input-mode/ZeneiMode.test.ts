import { expect } from 'chai';
import { ZeneiMode } from '../../../input-mode/ZeneiMode';
import { MockEditor } from '../mocks/MockEditor';

describe('ZeneiMode', () => {
    let zeneiMode: ZeneiMode;
    let mockEditor: MockEditor;

    beforeEach(() => {
        mockEditor = new MockEditor();
        zeneiMode = new ZeneiMode();
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
});