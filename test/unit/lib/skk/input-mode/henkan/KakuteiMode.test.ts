import { expect } from 'chai';
import { KakuteiMode } from '../../../../../../src/lib/skk/input-mode/henkan/KakuteiMode';
import { MockEditor } from '../../../../mocks/MockEditor';
import { AbstractKanaMode } from '../../../../../../src/lib/skk/input-mode/AbstractKanaMode';
import { HiraganaMode } from '../../../../../../src/lib/skk/input-mode/HiraganaMode';

describe('KakuteiMode', () => {
    describe('basic input handling', () => {
        let kakuteiMode: KakuteiMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            kakuteiMode = KakuteiMode.create(context, mockEditor);
        });

        it('should convert romaji to hiragana', () => {
            kakuteiMode.onLowerAlphabet(context, 'k');
            kakuteiMode.onLowerAlphabet(context, 'a');
            expect(mockEditor.getInsertedText()).to.equal('か');
        });

        it('should handle n+vowel correctly', () => {
            kakuteiMode.onLowerAlphabet(context, 'n');
            kakuteiMode.onLowerAlphabet(context, 'a');
            expect(mockEditor.getInsertedText()).to.equal('な');
        });

        it('should switch to ascii mode on l', () => {
            kakuteiMode.onLowerAlphabet(context, 'l');
            expect(mockEditor.getCurrentInputMode().constructor.name).to.equal('AsciiMode');
        });

        it('should switch kana mode on q', () => {
            kakuteiMode.onLowerAlphabet(context, 'q');
            expect(mockEditor.getCurrentInputMode().toString()).not.to.equal(context.toString());
        });
    });

    describe('henkan mode transitions', () => {
        let kakuteiMode: KakuteiMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            kakuteiMode = KakuteiMode.create(context, mockEditor);
            context.setHenkanMode(kakuteiMode);
        });

        it('should enter midashigo mode on uppercase input', () => {
            kakuteiMode.onUpperAlphabet(context, 'K');
            expect(context["henkanMode"].constructor.name).to.equal('MidashigoMode');
        });

        it('should enter abbrev mode on /', async () => {
            await kakuteiMode.onSymbol(context, '/');
            expect(context["henkanMode"].constructor.name).to.equal('AbbrevMode');
        });
    });

    describe('special character handling', () => {
        let kakuteiMode: KakuteiMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            kakuteiMode = KakuteiMode.create(context, mockEditor);
        });

        it('should insert space', () => {
            kakuteiMode.onSpace(context);
            expect(mockEditor.getInsertedText()).to.equal(' ');
        });

        it('should insert newline', () => {
            kakuteiMode.onEnter(context);
            expect(mockEditor.getInsertedText()).to.equal('\n');
        });

        it('should delete character on backspace', () => {
            kakuteiMode.onLowerAlphabet(context, 'a');
            kakuteiMode.onBackspace(context);
            expect(mockEditor.wasDeleteLeftCalled()).to.be.true;
        });
    });

    describe('buffer handling', () => {
        let kakuteiMode: KakuteiMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            kakuteiMode = KakuteiMode.create(context, mockEditor);
        });

        it('should clear buffer on Ctrl+G', () => {
            kakuteiMode.onLowerAlphabet(context, 'k');
            kakuteiMode.onCtrlG(context);
            expect(mockEditor.getRemainingRomaji()).to.equal('');
        });

        it('should clear buffer on Ctrl+J', () => {
            kakuteiMode.onLowerAlphabet(context, 'k');
            kakuteiMode.onCtrlJ(context);
            expect(mockEditor.getRemainingRomaji()).to.equal('');
        });
    });
});