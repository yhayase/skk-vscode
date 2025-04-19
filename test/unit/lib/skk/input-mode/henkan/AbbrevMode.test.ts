import { expect } from 'chai';
import { MockEditor } from '../../../../mocks/MockEditor';
import { EditorFactory } from '../../../../../../src/lib/skk/editor/EditorFactory';
import { AbbrevMode } from '../../../../../../src/lib/skk/input-mode/henkan/AbbrevMode';
import { AbstractKanaMode } from '../../../../../../src/lib/skk/input-mode/AbstractKanaMode';
import { HiraganaMode } from '../../../../../../src/lib/skk/input-mode/HiraganaMode';

describe('AbbrevMode', async () => {
    before(() => {
        // テストスイート全体で1回だけ実行される初期化
        const initialMockEditor = new MockEditor();
        EditorFactory.setInstance(initialMockEditor);
    });

    after(() => {
        // テストスイート全体の終了時に1回だけ実行されるクリーンアップ
        EditorFactory.reset();
    });

    describe('basic input handling', () => {
        let abbrevMode: AbbrevMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            // 各テストケース実行前に毎回実行される初期化
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            abbrevMode = new AbbrevMode(context, mockEditor);
        });

        it('should insert lowercase letters as is', async () => {
            await abbrevMode.onLowerAlphabet(context, 'a');
            expect(mockEditor.getInsertedText()).to.equal('a');
        });

        it('should insert uppercase letters as is', async () => {
            await abbrevMode.onUpperAlphabet(context, 'A');
            expect(mockEditor.getInsertedText()).to.equal('A');
        });

        it('should insert numbers as is', async () => {
            abbrevMode.onNumber(context, '1');
            expect(mockEditor.getInsertedText()).to.equal('1');
        });

        it('should insert symbols as is', async () => {
            abbrevMode.onSymbol(context, '@');
            expect(mockEditor.getInsertedText()).to.equal('@');
        });
    });

    describe('henkan handling', () => {
        let abbrevMode: AbbrevMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            // 各テストケース実行前に毎回実行される初期化
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            abbrevMode = new AbbrevMode(context, mockEditor);
            context.setHenkanMode(abbrevMode);
            mockEditor.setInputMode(context);
        });

        it('should start henkan on space', async () => {
            mockEditor.getJisyoProvider().registerCandidate('a', { word: 'α' });

            context.lowerAlphabetInput('a');
            await context.spaceInput();
            expect(context["henkanMode"].constructor.name).to.equal("InlineHenkanMode");
        });

        it('should enter henkan mode with current text', async () => {
            abbrevMode.onLowerAlphabet(context, 'h');
            abbrevMode.onLowerAlphabet(context, 't');
            abbrevMode.onLowerAlphabet(context, 't');
            abbrevMode.onLowerAlphabet(context, 'p');
            abbrevMode.onSpace(context);
            expect(mockEditor.getMidashigo()).to.equal('http');
        });

        it('should registration editor have unconverted romaji yomi', async () => {
            mockEditor.getJisyoProvider().registerCandidate('a', { word: 'α' });
            await context.lowerAlphabetInput('a');
            expect(mockEditor.getMidashigo()).to.equal('a');
            await context.spaceInput();
            expect(context["henkanMode"].constructor.name).to.equal('InlineHenkanMode');
            expect(mockEditor.getCurrentText()).to.equal('▼α');
            await context.spaceInput();
            expect(mockEditor.wasRegistrationEditorOpened()).to.be.true;
            expect(mockEditor.getRegistrationYomi()).to.equal('a', "辞書登録の読みは'a'であるべき");
        });

        it('should open registration editor on converting unexisting abbrev word', async () => {
            const unexistingWord = 'ahoskihoiasdfo';
            context.lowerAlphabetInput(unexistingWord);
            await context.spaceInput();
            expect(mockEditor.wasRegistrationEditorOpened()).to.be.true;
            expect(mockEditor.getRegistrationYomi()).to.equal(unexistingWord, `辞書登録の読みは'${unexistingWord}'であるべき`);
        });
    });

    describe('special input handling', () => {
        let abbrevMode: AbbrevMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            // 各テストケース実行前に毎回実行される初期化
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            abbrevMode = new AbbrevMode(context, mockEditor);
            context.setHenkanMode(abbrevMode);
        });

        it('should clear midashigo and switch to kakutei mode on Ctrl+G', async () => {
            await abbrevMode.onLowerAlphabet(context, 'h');
            await abbrevMode.onLowerAlphabet(context, 't');
            await abbrevMode.onCtrlG(context);
            expect(context["henkanMode"].constructor.name).to.equal('KakuteiMode');
            expect(mockEditor.getCurrentText()).to.equal('');
        });

        it('should fixate midashigo on Ctrl+J', async () => {
            await abbrevMode.onLowerAlphabet(context, 'h');
            await abbrevMode.onLowerAlphabet(context, 't');
            expect(mockEditor.getCurrentText()).to.equal('▽ht');
            await abbrevMode.onCtrlJ(context);
            expect(mockEditor.getCurrentText()).to.equal('ht');
        });

        it('should handle backspace correctly', async () => {
            await abbrevMode.onLowerAlphabet(context, 'a');
            await abbrevMode.onBackspace(context);
            expect(mockEditor.wasDeleteLeftCalled()).to.be.true;
        });

        it('should switch to kakutei mode when midashigo is empty after backspace', async () => {
            await context.backspaceInput();
            expect(context["henkanMode"].constructor.name).to.equal("KakuteiMode");
            expect(mockEditor.getCurrentText()).to.equal('');
        });

        it('should fixate midashigo and insert newline on enter', async () => {
            await abbrevMode.onLowerAlphabet(context, 'a');
            await abbrevMode.onEnter(context);
            expect(mockEditor.getCurrentText()).to.equal('a\n');
        });
    });
});