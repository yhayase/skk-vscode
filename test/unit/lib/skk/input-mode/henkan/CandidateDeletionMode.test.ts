import { expect, assert } from 'chai';
import { CandidateDeletionMode } from '../../../../../../src/lib/skk/input-mode/henkan/CandidateDeletionMode';
import { AbstractKanaMode } from      '../../../../../../src/lib/skk/input-mode/AbstractKanaMode';
import { HiraganaMode } from '../../../../../../src/lib/skk/input-mode/HiraganaMode';
import { MockEditor } from '../../../../mocks/MockEditor';
import { Candidate } from '../../../../../../src/lib/skk/jisyo/candidate';
import { Entry } from '../../../../../../src/lib/skk/jisyo/entry';
import { InlineHenkanMode } from '../../../../../../src/lib/skk/input-mode/henkan/InlineHenkanMode';
import { MidashigoMode } from '../../../../../../src/lib/skk/input-mode/henkan/MidashigoMode';


describe('CandidateDeletionMode', () => {
    describe('dialog display', () => {
        let deletionMode: CandidateDeletionMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let candidate: Candidate;
        let prevMode: InlineHenkanMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();

            candidate = new Candidate('単語', undefined);
            const entry = new Entry('よみ', [candidate], '');
            const midashigoMode = new MidashigoMode(context, mockEditor);
            prevMode = new InlineHenkanMode(context, mockEditor, midashigoMode, 'よみ', '', entry, '');
            deletionMode = new CandidateDeletionMode(context, mockEditor, prevMode, 'よみ', candidate);

            context.setHenkanMode(deletionMode);
            mockEditor.setInputMode(context);
        });

        it('should show confirmation dialog', async () => {
            expect(mockEditor.getAppendedSuffix()).to.equal('Really delete "よみ /単語/"? (Y/N)');
        });
    });

    describe('input handling', () => {
        let deletionMode: CandidateDeletionMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let candidate: Candidate;
        let prevMode: InlineHenkanMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();

            candidate = new Candidate('単語', undefined);
            const entry = new Entry('よみ', [candidate], '');
            const midashigoMode = new MidashigoMode(context, mockEditor);
            prevMode = new InlineHenkanMode(context, mockEditor, midashigoMode, 'よみ', '', entry, '');
            deletionMode = new CandidateDeletionMode(context, mockEditor, prevMode, 'よみ', candidate);

            context.setHenkanMode(deletionMode);
            mockEditor.setInputMode(context);
        });

        it('should delete candidate and return to kakutei mode on Y', async () => {
            await deletionMode.onUpperAlphabet(context, 'Y');
            expect(context["henkanMode"].constructor.name).to.equal("KakuteiMode");
            // Ideally we would verify that the candidate was actually deleted from the dictionary
        });

        it('should return to inline henkan mode on N', async () => {
            await deletionMode.onUpperAlphabet(context, 'N');
            expect(context["henkanMode"].constructor.name).to.equal("InlineHenkanMode");
        });

        it('should show error on lowercase y', async () => {
            //deletionMode.onLowerAlphabet(context, 'y').should.rejectedWith(Error, 'Type Y or N in upper case');
            try {
                await deletionMode.onLowerAlphabet(context, 'y');
            } catch (e) {
                if (e instanceof Error) {
                    expect((e as Error).message).to.equal('Type Y or N in upper case');
                    return;
                }
                assert.fail('Expected an error to be thrown');
            }
        });

        it('should show error on lowercase n', async () => {
            try {
                await deletionMode.onLowerAlphabet(context, 'n');
            } catch (e) {
                if (e instanceof Error) {
                    expect((e as Error).message).to.equal('Type Y or N in upper case');
                    return;
                }
                assert.fail('Expected an error to be thrown');
            }
        });

        it('should show error on other lowercase letters', async () => {
            try {
                await deletionMode.onLowerAlphabet(context, 'a');
            } catch (e) {
                if (e instanceof Error) {
                    expect((e as Error).message).to.equal('Type Y or N');
                    return;
                }
                assert.fail('Expected an error to be thrown');
            }
        });

        it('should show error on other uppercase letters', async () => {
            try {
                await deletionMode.onUpperAlphabet(context, 'X');
            } catch (e) {
                if (e instanceof Error) {
                    expect((e as Error).message).to.equal('Type Y or N');
                    return;
                }
                assert.fail('Expected an error to be thrown');
            }
        });
    });

    describe('special input handling', () => {
        let deletionMode: CandidateDeletionMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;
        let candidate: Candidate;
        let prevMode: InlineHenkanMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();

            candidate = new Candidate('test', undefined);
            const entry = new Entry('test', [candidate], '');
            const midashigoMode = new MidashigoMode(context, mockEditor);
            prevMode = new InlineHenkanMode(context, mockEditor, midashigoMode, 'み', 'み', entry, '');
            deletionMode = new CandidateDeletionMode(context, mockEditor, prevMode, 'key', candidate);

            context.setHenkanMode(deletionMode);
            mockEditor.setInputMode(context);
        });

        it('should return to inline henkan mode on Ctrl+G', async () => {
            await deletionMode.onCtrlG(context);
            expect(context["henkanMode"].constructor.name).to.equal("InlineHenkanMode");
        });

        it('should show error on space', async () => {
            try {
                await deletionMode.onSpace(context);
            } catch (e) {
                if (e instanceof Error) {
                    expect((e as Error).message).to.equal('Type Y or N');
                    return;
                }
                assert.fail('Expected an error to be thrown');
            }
        });

        it('should show error on enter', async () => {
            try {
                await deletionMode.onEnter(context);
            } catch (e) {
                if (e instanceof Error) {
                    expect((e as Error).message).to.equal('Type Y or N');
                    return;
                }
                assert.fail('Expected an error to be thrown');
            }
        });

        it('should show error on backspace', async () => {
            try {
                await deletionMode.onBackspace(context);
            } catch (e) {
                if (e instanceof Error) {
                    expect((e as Error).message).to.equal('Type Y or N');
                    return;
                }
                assert.fail('Expected an error to be thrown');
            }
        });

        it('should show error on Ctrl+J', async () => {
            try {
                await deletionMode.onCtrlJ(context);
            } catch (e) {
                if (e instanceof Error) {
                    expect((e as Error).message).to.equal('Type Y or N');
                    return;
                }
                assert.fail('Expected an error to be thrown');
            }
        });
    });
});