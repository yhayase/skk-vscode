import { expect } from 'chai';
import { MenuHenkanMode } from '../../../../../../src/lib/skk/input-mode/henkan/MenuHenkanMode';
import { MockEditor } from '../../../../mocks/MockEditor';
import { AbstractKanaMode } from '../../../../../../src/lib/skk/input-mode/AbstractKanaMode';
import { Entry } from '../../../../../../src/lib/skk/jisyo/entry';
import { InlineHenkanMode } from '../../../../../../src/lib/skk/input-mode/henkan/InlineHenkanMode';
import { HiraganaMode } from '../../../../../../src/lib/skk/input-mode/HiraganaMode';
import { Candidate } from '../../../../../../src/lib/skk/jisyo/candidate';
import { MidashigoMode } from '../../../../../../src/lib/skk/input-mode/henkan/MidashigoMode';

describe('MenuHenkanMode', () => {
    describe('candidate display', () => {
        let menuHenkanMode: MenuHenkanMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let entry: Entry;
        let prevMode: InlineHenkanMode;

        beforeEach(async () => {
            // 各テストケース実行前に毎回実行される初期化
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
                new Candidate('候補3', undefined),
                new Candidate('候補4', undefined),
                new Candidate('候補5', undefined),
                new Candidate('候補6', undefined),
                new Candidate('候補7', undefined),
                new Candidate('候補8', undefined),
                new Candidate('候補9', undefined),
                new Candidate('候補10', undefined),
            ];
            entry = new Entry('test', candidates, '');
            const midashigoMode = await MidashigoMode.create(context, mockEditor);
            prevMode = new InlineHenkanMode(context, mockEditor, midashigoMode, 'み', 'み', entry, '');
            menuHenkanMode = new MenuHenkanMode(context, mockEditor, prevMode, entry, 0, '', '');
        });

        it('should show candidate list with selection keys', async () => {
            const candidateList = mockEditor.getCandidateList();
            expect(candidateList.candidates.length).to.equal(7); // Max display candidates
            expect(candidateList.selectionKeys).to.deep.equal(['A', 'S', 'D', 'F', 'J', 'K', 'L']);
        });

        it('should show next page on space', async () => {
            await menuHenkanMode.onSpace(context);
            const candidateList = mockEditor.getCandidateList();
            expect(candidateList.candidates[0].word).to.equal('候補8');
        });

        it('should show previous page on backspace', async () => {
            await menuHenkanMode.onSpace(context);
            await menuHenkanMode.onBackspace(context);
            const candidateList = mockEditor.getCandidateList();
            expect(candidateList.candidates[0].word).to.equal('候補1');
        });
    });

    describe('candidate selection', () => {
        let menuHenkanMode: MenuHenkanMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let entry: Entry;
        let prevMode: InlineHenkanMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
                new Candidate('候補3', undefined),
            ];
            entry = new Entry('test', candidates, '');
            const midashigoMode = await MidashigoMode.create(context, mockEditor);
            prevMode = new InlineHenkanMode(context, mockEditor, midashigoMode, 'み', 'み', entry, '');
            menuHenkanMode = new MenuHenkanMode(context, mockEditor, prevMode, entry, 0, '', '');
            context.setHenkanMode(menuHenkanMode);
            mockEditor.setInputMode(context);
        });

        it('should select candidate with lowercase selection key', async () => {
            await menuHenkanMode.onLowerAlphabet(context, 'a');
            expect(mockEditor.getCurrentText()).to.equal('候補1');
            expect(context["henkanMode"].constructor.name).to.equal('KakuteiMode');
        });

        it('should select candidate with uppercase selection key', async () => {
            await menuHenkanMode.onUpperAlphabet(context, 'S');
            expect(mockEditor.getCurrentText()).to.equal('候補2');
            expect(context["henkanMode"].constructor.name).to.equal('KakuteiMode');
        });

        it('should show error for invalid selection key', async () => {
            await menuHenkanMode.onLowerAlphabet(context, 'z');
            expect(mockEditor.getLastErrorMessage()).to.contain('not valid here');
        });
    });

    describe('special input handling', () => {
        let menuHenkanMode: MenuHenkanMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let entry: Entry;
        let prevMode: InlineHenkanMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
                new Candidate('候補3', undefined),
            ];
            entry = new Entry('test', candidates, '');
            const midashigoMode = await MidashigoMode.create(context, mockEditor, 'kanji');
            prevMode = new InlineHenkanMode(context, mockEditor, midashigoMode, 'かんじ', '', entry, '');
            menuHenkanMode = new MenuHenkanMode(context, mockEditor, prevMode, entry, 0, '', '');
        });

        it('should return to midashigo mode on Ctrl+G', async () => {
            await menuHenkanMode.onCtrlG(context);
            expect(mockEditor.getCurrentText()).to.contain('▽かんじ');
            expect(context["henkanMode"].constructor.name).to.equal('MidashigoMode');
        });

        it('should show error on Ctrl+J', async () => {
            await menuHenkanMode.onCtrlJ(context);
            expect(mockEditor.getLastErrorMessage()).to.contain('not valid here');
        });

        it('should show error on Enter', async () => {
            await menuHenkanMode.onEnter(context);
            expect(mockEditor.getLastErrorMessage()).to.contain('not valid here');
        });

        it('should handle okuri in fixation', async () => {
            const menuHenkanWithSuffix = new MenuHenkanMode(context, mockEditor, prevMode, entry, 0, 'です', '');
            await menuHenkanWithSuffix.onLowerAlphabet(context, 'a');
            expect(mockEditor.getFixatedCandidate()).to.equal('候補1です');
        });
    });

    describe('registration handling', () => {
        let menuHenkanMode: MenuHenkanMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let entry: Entry;
        let prevMode: InlineHenkanMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
                new Candidate('候補3', undefined),
            ];
            entry = new Entry('test', candidates, '');
            const midashigoMode = await MidashigoMode.create(context, mockEditor);
            prevMode = new InlineHenkanMode(context, mockEditor, midashigoMode, 'み', 'み', entry, '');
            menuHenkanMode = new MenuHenkanMode(context, mockEditor, prevMode, entry, 0, '', '');
        });

        it('should open registration editor on dot', async () => {
            await menuHenkanMode.onSymbol(context, '.');
            expect(mockEditor.wasRegistrationEditorOpened()).to.be.true;
        });

        it('should open registration editor when no more candidates', async () => {
            // 最大10回まで次のページを試行
            let maxTries = 10;
            while (maxTries > 0 && mockEditor.getCandidateList().candidates[0]?.word !== '緩治') {
                await menuHenkanMode.onSpace(context);
                maxTries--;
            }
            await menuHenkanMode.onSpace(context);
            expect(mockEditor.wasRegistrationEditorOpened()).to.be.true;
        });
    });

    describe('getActiveKeys', () => {
        let menuHenkanMode: MenuHenkanMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let entry: Entry;
        let prevMode: InlineHenkanMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [ new Candidate('候補1', undefined) ];
            entry = new Entry('test', candidates, '');
            const midashigoMode = await MidashigoMode.create(context, mockEditor);
            prevMode = new InlineHenkanMode(context, mockEditor, midashigoMode, 'み', 'み', entry, '');
            menuHenkanMode = new MenuHenkanMode(context, mockEditor, prevMode, entry, 0, '', '');
        });

        it('should return a set containing all printable ASCII, enter, backspace, ctrl+j, ctrl+g', () => {
            const activeKeys = menuHenkanMode.getActiveKeys();
            const expectedKeys = new Set<string>();

            // Add all printable ASCII characters (as MenuHenkanMode currently defines them)
            for (let i = 32; i <= 126; i++) {
                const char = String.fromCharCode(i);
                if ("a" <= char && char <= "z") {
                    expectedKeys.add(char);
                    expectedKeys.add("shift+" + char); // Consistent with MidashigoMode's updated getActiveKeys
                } else if ("A" <= char && char <= "Z") {
                    // Assumed covered by shift+lowercase
                } else {
                    expectedKeys.add(char);
                }
            }
            // Special keys explicitly handled or causing errors
            expectedKeys.add("enter");
            expectedKeys.add("backspace");
            expectedKeys.add("ctrl+j");
            expectedKeys.add("ctrl+g");
            
            // Verify all expected keys are present
            for (const key of expectedKeys) {
                expect(activeKeys.has(key), `activeKeys should contain '${key}'`).to.be.true;
            }
            
            // Verify no unexpected keys are present
            for (const key of activeKeys) {
                expect(expectedKeys.has(key), `activeKeys should not contain unexpected key '${key}'`).to.be.true;
            }
            
            expect(activeKeys.size).to.equal(expectedKeys.size, "activeKeys and expectedKeys should have the same size");
        });
    });
});
