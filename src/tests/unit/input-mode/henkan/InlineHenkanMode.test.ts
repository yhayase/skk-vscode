import { expect } from 'chai';
import { InlineHenkanMode } from '../../../../input-mode/henkan/InlineHenkanMode';
import { AbstractKanaMode } from '../../../../input-mode/AbstractKanaMode';
import { HiraganaMode } from '../../../../input-mode/HiraganaMode';
import { MockEditor } from '../../mocks/MockEditor';
import { Candidate } from '../../../../jisyo/candidate';
import { Entry } from '../../../../jisyo/entry';
import { MidashigoMode } from '../../../../input-mode/henkan/MidashigoMode';

describe('InlineHenkanMode', () => {
    describe('candidate display', () => {
        let inlineHenkanMode: InlineHenkanMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let entry: Entry;
        let prevMode: MidashigoMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
                new Candidate('候補3', undefined),
                new Candidate('候補4', undefined),
            ];
            entry = new Entry('test', candidates, '');
            prevMode = new MidashigoMode(context, mockEditor);
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

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
            ];
            entry = new Entry('てすと', candidates, '');
            prevMode = new MidashigoMode(context, mockEditor, "tesuto");
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

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
            ];
            entry = new Entry('test', candidates, '');
            prevMode = new MidashigoMode(context, mockEditor, 'a');
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

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            const candidates = [
                new Candidate('候補1', undefined),
                new Candidate('候補2', undefined),
            ];
            entry = new Entry('test', candidates, '');
            prevMode = new MidashigoMode(context, mockEditor, 'a');
        });

        it('should handle suffix in fixation', async () => {
            const suffixEntry = new InlineHenkanMode(context, mockEditor, prevMode, 'み', '', entry, 'です');
            suffixEntry.onCtrlJ(context);
            expect(mockEditor.getFixatedCandidate()).to.equal('候補1です');
        });
    });
});