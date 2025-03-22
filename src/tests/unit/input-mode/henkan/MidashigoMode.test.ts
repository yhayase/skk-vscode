import { expect } from 'chai';
import { MidashigoMode } from '../../../../input-mode/henkan/MidashigoMode';
import { AbstractKanaMode } from '../../../../input-mode/AbstractKanaMode';
import { HiraganaMode } from '../../../../input-mode/HiraganaMode';
import { MockEditor } from '../../mocks/MockEditor';

describe('MidashigoMode', () => {
    describe('basic input handling', () => {
        let midashigoMode: MidashigoMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = new MidashigoMode(context, mockEditor, '');
        });

        it('should convert romaji to hiragana in midashigo', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            expect(mockEditor.getCurrentText()).to.equal('▽か');
        });

        it('should handle n+vowel correctly in midashigo', async () => {
            await midashigoMode.onLowerAlphabet(context, 'n');
            await midashigoMode.onLowerAlphabet(context, 'a');
            expect(mockEditor.getCurrentText()).to.equal('▽な');
        });

        it('should switch to ascii mode on l', async () => {
            await midashigoMode.onLowerAlphabet(context, 'l');
            expect(mockEditor.getCurrentInputMode().constructor.name).to.equal('AsciiMode');
        });

        it('should toggle kana type and switch to kakutei mode on q', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onLowerAlphabet(context, 'q');
            expect(mockEditor.getCurrentText()).to.equal('カ');
        });
    });

    describe('henkan mode transitions', () => {
        let midashigoMode: MidashigoMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = new MidashigoMode(context, mockEditor, '');

            context.setHenkanMode(midashigoMode);
            midashigoMode.onLowerAlphabet(context, '');

            mockEditor.getJisyoProvider().registerCandidate('か', {
                word: '可',
            });
        });

        it('should enter okurigana mode on uppercase input', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onUpperAlphabet(context, 'K');
            expect(mockEditor.isOkuriStateActive()).to.be.true;
        });

        it('should start henkan on space', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onSpace(context);
            expect(context["henkanMode"].constructor.name).to.equal('InlineHenkanMode');
        });
    });

    describe('okurigana handling', () => {
        let midashigoMode: MidashigoMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = new MidashigoMode(context, mockEditor, '');
            context.setHenkanMode(midashigoMode);
            mockEditor.setInputMode(context);
            mockEditor.getJisyoProvider().registerCandidate('かk', {
                word: '書',
            });

        });

        it('should accept okurigana input and start henkan', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onUpperAlphabet(context, 'K');
            await midashigoMode.onLowerAlphabet(context, 'a');
            expect(context["henkanMode"].constructor.name).to.equal('InlineHenkanMode');
            expect(mockEditor.getCurrentText()).to.equal('▼書か');
        });

    });

    describe('special input handling', () => {
        let midashigoMode: MidashigoMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = new MidashigoMode(context, mockEditor, '');

            context.setHenkanMode(midashigoMode);
            mockEditor.setInputMode(context);
        });

        it('should clear midashigo on Ctrl+G', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onCtrlG(context);
            expect(mockEditor.getCurrentText()).to.equal('');
            expect(context["henkanMode"].constructor.name).to.equal('KakuteiMode');
        });

        it('should fixate midashigo on Ctrl+J', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onCtrlJ(context);
            expect(mockEditor.getCurrentText()).to.equal('か');
            expect(context["henkanMode"].constructor.name).to.equal('KakuteiMode');
        });

        it('should handle backspace correctly', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onBackspace(context);
            expect(mockEditor.getCurrentText()).to.equal('▽');
            expect(context["henkanMode"].constructor.name).to.equal('MidashigoMode');
        });
    });

    describe('punctuation handling', () => {
        let midashigoMode: MidashigoMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = new MidashigoMode(context, mockEditor, '');

            context.setHenkanMode(midashigoMode);
            midashigoMode.onLowerAlphabet(context, '');

            mockEditor.getJisyoProvider().registerCandidate('か', {
                word: '可',
            });
        });

        it('should start henkan before punctuation', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onSymbol(context, '.');
            expect(context["henkanMode"].constructor.name).to.equal('InlineHenkanMode');
            expect(mockEditor.getCurrentText()).to.equal('▼可。');
        });
    });
});