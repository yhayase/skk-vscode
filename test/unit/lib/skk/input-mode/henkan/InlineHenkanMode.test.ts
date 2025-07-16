import { expect } from 'chai';
import { InlineHenkanMode } from '../../../../../../src/lib/skk/input-mode/henkan/InlineHenkanMode';
import { MockEditor } from '../../../../mocks/MockEditor';
import { AbstractKanaMode } from '../../../../../../src/lib/skk/input-mode/AbstractKanaMode';
import { Entry } from '../../../../../../src/lib/skk/jisyo/entry';
import { MidashigoMode } from '../../../../../../src/lib/skk/input-mode/henkan/MidashigoMode';
import { HiraganaMode } from '../../../../../../src/lib/skk/input-mode/HiraganaMode';
import { Candidate } from '../../../../../../src/lib/skk/jisyo/candidate';

describe('InlineHenkanMode', () => {
    describe('candidate display', () => {
        let inlineHenkanMode: InlineHenkanMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let entry: Entry;
        let prevMode: MidashigoMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
                new Candidate('候補3', undefined),
                new Candidate('候補4', undefined),
            ];
            entry = new Entry('test', candidates, '');
            prevMode = await MidashigoMode.create(context, mockEditor);
            inlineHenkanMode = new InlineHenkanMode(context, mockEditor, prevMode, 'み', 'み', entry, '');

            context.setHenkanMode(inlineHenkanMode);
            mockEditor.setInputMode(context);
        });

        it('should show first candidate initially', () => {
            expect(mockEditor.getCurrentCandidate()?.word).to.equal('候補1');
        });

        it('should show next candidate on space', () => {
            inlineHenkanMode.onSpace(context);
            expect(mockEditor.getCurrentCandidate()?.word).to.equal('候補2');
        });

        it('should show previous candidate on x', () => {
            inlineHenkanMode.onSpace(context);
            inlineHenkanMode.onLowerAlphabet(context, 'x');
            expect(mockEditor.getCurrentCandidate()?.word).to.equal('候補1');
        });

        it('should switch to menu mode after max inline candidates', () => {
            inlineHenkanMode.onSpace(context);
            inlineHenkanMode.onSpace(context);
            inlineHenkanMode.onSpace(context);
            expect(context["henkanMode"].constructor.name).to.equal('MenuHenkanMode');
        });
    });

    describe('candidate selection', () => {
        let inlineHenkanMode: InlineHenkanMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let entry: Entry;
        let prevMode: MidashigoMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
            ];
            entry = new Entry('てすと', candidates, '');
            prevMode = await MidashigoMode.create(context, mockEditor, "tesuto");
            inlineHenkanMode = new InlineHenkanMode(context, mockEditor, prevMode, 'てすと', '', entry, '');

            mockEditor.setInputMode(context);
            context.setHenkanMode(inlineHenkanMode);
        });

        it('should fixate candidate and switch to kakutei mode on Ctrl+J', async () => {
            await inlineHenkanMode.onCtrlJ(context);
            expect(context["henkanMode"].constructor.name).to.equal('KakuteiMode');
        });

        it('should clear candidate and return to midashigo mode on Ctrl+G', async () => {
            await inlineHenkanMode.onCtrlG(context);
            expect(mockEditor.getCurrentText()).to.contain('▽てすと');
            expect(context["henkanMode"].constructor.name).to.equal('MidashigoMode');
        });

        it('should fixate candidate and switch to ascii mode on l', async () => {
            await inlineHenkanMode.onLowerAlphabet(context, 'l');
            expect(mockEditor.getCurrentInputMode().constructor.name).to.equal('AsciiMode');
        });

        it('should fixate candidate and switch to zenei mode on L', async () => {
            await inlineHenkanMode.onUpperAlphabet(context, 'L');
            expect(mockEditor.getCurrentInputMode().constructor.name).to.equal('ZeneiMode');
        });
    });

    describe('special input handling', () => {
        let inlineHenkanMode: InlineHenkanMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let entry: Entry;
        let prevMode: MidashigoMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
            ];
            entry = new Entry('test', candidates, '');
            prevMode = await MidashigoMode.create(context, mockEditor, 'a');
            inlineHenkanMode = new InlineHenkanMode(context, mockEditor, prevMode, 'み', '', entry, '');

            mockEditor.setInputMode(context);
            context.setHenkanMode(inlineHenkanMode);

            candidates.forEach((candidate) => {
                mockEditor.getJisyoProvider().registerCandidate('み', candidate);
            });
        });

        it('should fixate and insert newline on enter', async () => {
            await inlineHenkanMode.onEnter(context);
            //expect(mockEditor.getCurrentText()).to.equal('候補1\n');
            expect(context["henkanMode"].constructor.name).to.equal('KakuteiMode');
        });

        it('should fixate and handle backspace', async () => {
            await inlineHenkanMode.onBackspace(context);
            expect(mockEditor.getCurrentText()).to.equal('候補');
            expect(context["henkanMode"].constructor.name).to.equal('KakuteiMode');
        });

        it('should switch to candidate deletion mode on X', async () => {
            await inlineHenkanMode.onUpperAlphabet(context, 'X');
            expect(context["henkanMode"].constructor.name).to.equal('CandidateDeletionMode');
        });
    });

    describe('suffix handling', () => {
        let inlineHenkanMode: InlineHenkanMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let entry: Entry;
        let prevMode: MidashigoMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
            ];
            entry = new Entry('test', candidates, '');
            prevMode = await MidashigoMode.create(context, mockEditor, 'a');
        });

        it('should handle suffix in fixation', async () => {
            const suffixEntry = new InlineHenkanMode(context, mockEditor, prevMode, 'み', '', entry, 'です');
            suffixEntry.onCtrlJ(context);
            expect(mockEditor.getFixatedCandidate()).to.equal('候補1です');
        });
    });

    describe('getActiveKeys', () => {
        let inlineHenkanMode: InlineHenkanMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let entry: Entry;
        let prevMode: MidashigoMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [new Candidate('候補1', undefined)];
            entry = new Entry('test', candidates, '');
            prevMode = await MidashigoMode.create(context, mockEditor);
            inlineHenkanMode = new InlineHenkanMode(context, mockEditor, prevMode, 'み', 'み', entry, '');
        });

        it('should return a set containing all printable ASCII, enter, backspace, ctrl+j, ctrl+g', () => {
            const activeKeys = inlineHenkanMode.getActiveKeys();
            const expectedKeys = new Set<string>();

            // Add all printable ASCII characters
            for (let i = 32; i <= 126; i++) {
                const char = String.fromCharCode(i);
                if ("a" <= char && char <= "z") {
                    expectedKeys.add(char);
                    expectedKeys.add("shift+" + char);
                } else if ("A" <= char && char <= "Z") {
                    // Assumed covered by shift+lowercase
                } else {
                    expectedKeys.add(char);
                }
            }
            expectedKeys.add("greater"); // '>' symbol for suffix handling

            // Special keys
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


    describe('Suffix Entry Mode Initiation', () => {
        let inlineHenkanMode: InlineHenkanMode;
        let mockEditor: MockEditor;
        let context: HiraganaMode;
        let entry: Entry;
        let prevMode: MidashigoMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('小林', undefined),
            ];
            entry = new Entry('こばやし', candidates, '');
            prevMode = await MidashigoMode.create(context, mockEditor, "kobayashi");
            inlineHenkanMode = new InlineHenkanMode(context, mockEditor, prevMode, '小林', '', entry, '');

            mockEditor.setInputMode(context);
            context.setHenkanMode(inlineHenkanMode);
        });

        it('should fixate current candidate, transition to MidashigoMode, and set editor to "▽>" after fixated candidate when ">" is pressed', async () => {
            let capturedHenkanMode: any;
            context.setHenkanMode = (mode: any) => {
                capturedHenkanMode = mode;
            };

            await inlineHenkanMode.onSymbol(context, '>');

            // 1. 候補が確定されたことを検証
            expect(mockEditor.getFixatedCandidate()).to.equal('小林', 'The current candidate should be fixated.');

            // 2. モードが MidashigoMode に遷移したことを検証
            expect(capturedHenkanMode).to.be.an.instanceOf(MidashigoMode, 'Should transition to MidashigoMode.');

            // 3. エディタの表示が「確定された候補 + ▽>」になっていることを検証
            // DDSKKの仕様に基づき、確定された候補の直後に「▽>」が続くことを確認します。
            expect(mockEditor.getCurrentText()).to.equal('小林▽>', 'Editor text should be "小林▽>".');
        });
    });
