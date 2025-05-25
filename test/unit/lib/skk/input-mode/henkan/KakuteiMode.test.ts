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

    describe('getActiveKeys and getContextualName', () => {
        let kakuteiMode: KakuteiMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode(); // KakuteiMode is usually part of a KanaMode
            kakuteiMode = KakuteiMode.create(context, mockEditor);
            context.setHenkanMode(kakuteiMode); // Ensure context uses this KakuteiMode instance
            mockEditor.setInputMode(context);
        });

        it('getContextualName should return "kakutei"', () => {
            expect(kakuteiMode.getContextualName()).to.equal('kakutei');
        });

        describe('getActiveKeys', () => {
            let kakuteiMode: KakuteiMode;
            let mockEditor: MockEditor;
            let context: AbstractKanaMode;

            beforeEach(() => {
                mockEditor = new MockEditor();
                context = new HiraganaMode(); // KakuteiMode is usually part of a KanaMode
                kakuteiMode = KakuteiMode.create(context, mockEditor);
                context.setHenkanMode(kakuteiMode); // Ensure context uses this KakuteiMode instance
                mockEditor.setInputMode(context);
            });

            it('should include all printable ASCII characters, space, backspace, ctrl+g, ctrl+j when there is no pending romaji', () => {
                // No pending romaji by default
                expect(mockEditor.getRemainingRomaji()).to.equal('');

                const activeKeys = kakuteiMode.getActiveKeys();
                const expectedKeys = new Set<string>();

                // Printable ASCII (excluding uppercase letters which are shift+lowercase)
                for (let i = 32; i <= 126; i++) {
                    const char = String.fromCharCode(i);
                    if ("a" <= char && char <= "z") {
                        expectedKeys.add(char);
                        expectedKeys.add("shift+" + char);
                    } else if ("A" <= char && char <= "Z") {
                        // Covered by shift+lowercase
                    } else {
                        expectedKeys.add(char);
                    }
                }

                // Special keys always active in KakuteiMode
                expectedKeys.add("backspace");
                expectedKeys.add("ctrl+j");
                expectedKeys.add("ctrl+g");
                expectedKeys.add(" "); // Space

                // 'enter' should NOT be present when there is no pending romaji
                expect(activeKeys.has('enter'), "activeKeys should NOT contain 'enter' when no pending romaji").to.be.false;

                // Check that all expected keys are present
                for (const key of expectedKeys) {
                    expect(activeKeys.has(key), `activeKeys should contain '${key}'`).to.be.true;
                }

                // Check that no unexpected keys are present (size check)
                expect(activeKeys.size).to.equal(expectedKeys.size);
            });

            it('should include "enter" in activeKeys when there is pending romaji', async () => {
                // Simulate typing a character to create pending romaji
                await kakuteiMode.onLowerAlphabet(context, 'k');
                expect(mockEditor.getRemainingRomaji()).to.equal('k'); // Verify pending romaji

                const activeKeys = kakuteiMode.getActiveKeys();
                expect(activeKeys.has('enter'), "activeKeys should contain 'enter' when there is pending romaji").to.be.true;

                // Also check a few other keys are still present
                expect(activeKeys.has('a'), "key 'a'").to.be.true;
                expect(activeKeys.has('backspace'), "key 'backspace'").to.be.true;
                expect(activeKeys.has('ctrl+j'), "key 'ctrl+j'").to.be.true;
            });

            it('should not include "enter" in activeKeys after pending romaji is cleared', async () => {
                await kakuteiMode.onLowerAlphabet(context, 'k'); // Create pending romaji
                expect(mockEditor.getRemainingRomaji()).to.equal('k'); // Verify pending romaji

                await kakuteiMode.onCtrlJ(context); // Clear pending romaji
                expect(mockEditor.getRemainingRomaji()).to.equal(''); // Verify romaji buffer is cleared

                const activeKeys = kakuteiMode.getActiveKeys();
                expect(activeKeys.has('enter'), "activeKeys should NOT contain 'enter' after buffer clear").to.be.false;

                // Check other keys are still present
                expect(activeKeys.has('a'), "key 'a'").to.be.true;
                expect(activeKeys.has('backspace'), "key 'backspace'").to.be.true;
            });
        });

        it('getContextualName should return "kakutei"', () => {
            let kakuteiMode: KakuteiMode;
            let mockEditor: MockEditor;
            let context: AbstractKanaMode;

            mockEditor = new MockEditor();
            context = new HiraganaMode();
            kakuteiMode = KakuteiMode.create(context, mockEditor);
            context.setHenkanMode(kakuteiMode);
            mockEditor.setInputMode(context);

            expect(kakuteiMode.getContextualName()).to.equal('kakutei');
        });
    });
});
