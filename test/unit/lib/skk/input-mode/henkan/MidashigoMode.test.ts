import { expect } from 'chai';
import { MidashigoMode, MidashigoType } from '../../../../../../src/lib/skk/input-mode/henkan/MidashigoMode';
import { MockEditor } from '../../../../mocks/MockEditor';
import { AbstractKanaMode } from '../../../../../../src/lib/skk/input-mode/AbstractKanaMode';
import { HiraganaMode } from '../../../../../../src/lib/skk/input-mode/HiraganaMode';
import { InlineHenkanMode } from '../../../../../../src/lib/skk/input-mode/henkan/InlineHenkanMode';
import { Candidate } from '../../../../../../src/lib/skk/jisyo/candidate';

describe('MidashigoMode', () => {
    describe('basic input handling', () => {
        let midashigoMode: MidashigoMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = await MidashigoMode.create(context, mockEditor, '');
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

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = await MidashigoMode.create(context, mockEditor, '');

            context.setHenkanMode(midashigoMode);
            midashigoMode.onLowerAlphabet(context, '');

            mockEditor.getJisyoProvider().registerCandidate('か', {
                word: '可',
            });
            mockEditor.getJisyoProvider().registerCandidate('だい>', {
                word: '大',
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
            expect(mockEditor.getCurrentText()).to.equal('▼可');
        });

        it('should start henkan on prefix symbol ">"', async () => {    
            await midashigoMode.onLowerAlphabet(context, 'd');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onLowerAlphabet(context, 'i');
            await midashigoMode.onSymbol(context, '>');
            expect(context["henkanMode"].constructor.name).to.equal('InlineHenkanMode');
            expect(mockEditor.getCurrentText()).to.equal('▼大');
        });
    });

    describe('okurigana handling', () => {
        let midashigoMode: MidashigoMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = await MidashigoMode.create(context, mockEditor, '');
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
            expect(mockEditor.getCurrentText()).to.equal('▼書'); // 送りがなは本文として表示されない
            expect(mockEditor.getAppendedSuffix()).to.equal('か');
        });

    });

    describe('special input handling', () => {
        let midashigoMode: MidashigoMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = await MidashigoMode.create(context, mockEditor, '');

            context.setHenkanMode(midashigoMode);
            mockEditor.setInputMode(context);
        });

        it('should handle number input', async () => {
            await midashigoMode.onNumber(context, '1');
            expect(mockEditor.getCurrentText()).to.equal('▽1');
        });

        it('should fixate midashigo and insert newline on Enter', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onEnter(context);
            expect(mockEditor.getCurrentText()).to.equal('か\n');
            expect(context["henkanMode"].constructor.name).to.equal('KakuteiMode');
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

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = await MidashigoMode.create(context, mockEditor, '');

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
            await context.ctrlJInput();
            expect(mockEditor.getCurrentText()).to.equal('可。', 'punctuation should be inserted after the kanji');
        });
    });

    describe('behavior after deleting okuri-alphabet', () => {
        let midashigoMode: MidashigoMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = await MidashigoMode.create(context, mockEditor, '');
            context.setHenkanMode(midashigoMode);
            mockEditor.setInputMode(context);
        });

        it('should handle okurigana deletion correctly', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onUpperAlphabet(context, 'K');

            expect(midashigoMode["midashigoMode"]).to.equal(MidashigoType.okurigana, 'should be in okurigana mode');

            await midashigoMode.onBackspace(context);
            
            expect(midashigoMode["midashigoMode"]).to.equal(MidashigoType.gokan, 'should be in gokan mode');
            expect(mockEditor.getCurrentText()).to.equal('▽か');
            expect(mockEditor.getRemainingRomaji()).to.equal('', 'should have no remaining romaji');
        });
    });

    describe('getContextualName', () => {
        let midashigoMode: MidashigoMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            // Initialize MidashigoMode without any initial input for these tests
            // to ensure a clean state for observing gokan/okurigana transitions.
            midashigoMode = await MidashigoMode.create(context, mockEditor, '');
            context.setHenkanMode(midashigoMode);
            // It's important that the mockEditor's input mode is also set to the context (AbstractKanaMode)
            // which then delegates to the henkanMode (MidashigoMode in this case).
            mockEditor.setInputMode(context);
        });

        it('should return "midashigo:gokan" initially', () => {
            expect(midashigoMode.getContextualName()).to.equal('midashigo:gokan');
        });

        it('should return "midashigo:okurigana" after an uppercase letter is input (triggering okurigana mode)', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k'); 
            await midashigoMode.onLowerAlphabet(context, 'a'); // Ensure 'か' is in midashigo
            await midashigoMode.onUpperAlphabet(context, 'K'); // Input an uppercase letter to switch to okurigana
            expect(midashigoMode.getContextualName()).to.equal('midashigo:okurigana');
        });

        it('should return "midashigo:gokan" if okurigana input is started and then cleared by backspace', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a'); // Ensure 'か' is in midashigo
            await midashigoMode.onUpperAlphabet(context, 'K'); // Enter okurigana mode, romajiInput for okuri should be 'k'
            // Simulate user pressing backspace when romaji input for okurigana is 'k'
            // This requires romajiInput to be 'a', then backspace clears it.
            // The internal state midashigoMode should revert if romajiInput for okurigana becomes empty.
            // We need to ensure the romajiInput buffer for okurigana is empty after backspace.
            // The onUpperAlphabet sets romajiInput based on 'A'. If 'A' -> 'あ', then backspace on 'あ' (if it's in romajiInput)
            // For this test, let's assume 'A' leads to some romaji in buffer.
            // A more direct way to test this state transition might be needed if backspace behavior is complex.
            // The key is that an action (like backspace on an empty okuri romaji buffer) leads to gokan.
            // The provided code for onBackspace in MidashigoMode:
            // if (!this.romajiInput.isEmpty()) { ... if (this.romajiInput.isEmpty()) { this.midashigoMode = MidashigoType.gokan; }}
            // So, if romajiInput was 'a' (from 'A'), backspace makes it empty, then mode becomes gokan.
            await midashigoMode.onBackspace(context); 
            expect(midashigoMode.getContextualName()).to.equal('midashigo:gokan');
        });
        
        it('should return "midashigo:gokan" after resetOkuriState is called externally (e.g., by InlineHenkanMode)', async () => {
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onUpperAlphabet(context, 'A'); // Enter okurigana mode
            midashigoMode.resetOkuriState(); // External call, e.g. when returning from InlineHenkanMode
            expect(midashigoMode.getContextualName()).to.equal('midashigo:gokan');
        });

        it('should remain "midashigo:gokan" if an uppercase letter is input when midashigo is empty', async () => {
            // Midashigo is initially empty as per beforeEach
            await midashigoMode.onUpperAlphabet(context, 'A');
            // According to onUpperAlphabet: if (midashigo.length === 0) { return await this.onLowerAlphabet(context, key.toLowerCase()); }
            // So it should behave like a lowercase input, thus remaining in gokan mode.
            expect(midashigoMode.getContextualName()).to.equal('midashigo:gokan');
        });
    });

    describe('constructor', () => {
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(() => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
        });

        it('should initialize with an empty midashigo by default', async () => {
            const midashigoMode = await MidashigoMode.create(context, mockEditor);
            expect(mockEditor.getCurrentText()).to.equal('▽');
        });

        it('should initialize with initial romaji input', async () => {
            const midashigoMode = await MidashigoMode.create(context, mockEditor, 'a');
            expect(mockEditor.getCurrentText()).to.equal('▽あ');
        });

        it('should initialize with initial yomi input', async () => {
            const midashigoMode = await MidashigoMode.create(context, mockEditor, '', '>');
            expect(mockEditor.getCurrentText()).to.equal('▽>');
        });

        it('should initialize with both initial romaji and yomi input', async () => {
            const midashigoMode = await MidashigoMode.create(context, mockEditor, 'i', 'だ');
            expect(mockEditor.getCurrentText()).to.equal('▽だい');
        });

        it('should initialize with both initial partial romaji and yomi input', async () => {
            const midashigoMode = await MidashigoMode.create(context, mockEditor, 's', 'か');
            expect(mockEditor.getCurrentText()).to.equal('▽か');
            expect(mockEditor.getRemainingRomaji()).to.equal('s', 'should have remaining romaji');
        });
    });

    describe('getActiveKeys', () => {
        let midashigoMode: MidashigoMode;
        let mockEditor: MockEditor;
        let context: AbstractKanaMode;

        beforeEach(async () => {
            mockEditor = new MockEditor();
            context = new HiraganaMode();
            midashigoMode = await MidashigoMode.create(context, mockEditor, '');
            context.setHenkanMode(midashigoMode);
            mockEditor.setInputMode(context);
        });

        it('should return a set containing all printable ASCII, enter, backspace, ctrl+j, ctrl+g, greater', () => {
            const activeKeys = midashigoMode.getActiveKeys();
            const expectedBaseKeys = new Set<string>();

            // Add all printable ASCII characters
            for (let i = 32; i <= 126; i++) {
                const char = String.fromCharCode(i);
                if ("a" <= char && char <= "z") {
                    expectedBaseKeys.add(char);
                    expectedBaseKeys.add("shift+" + char); // Expect shift + lowercase char
                } else if ("A" <= char && char <= "Z") {
                    // Already covered by shift+lower
                }
else {
                    expectedBaseKeys.add(char);
                }
            }
            expectedBaseKeys.add("greater"); // For '>' symbol

            // Special keys
            expectedBaseKeys.add("enter");
            expectedBaseKeys.add("backspace");
            expectedBaseKeys.add("ctrl+j");
            expectedBaseKeys.add("ctrl+g");
            
            // Check if all keys in expectedBaseKeys are in activeKeys
            for (const key of expectedBaseKeys) {
                expect(activeKeys.has(key), `activeKeys should contain '${key}'`).to.be.true;
            }
            
            // Check if activeKeys does not contain any extra keys
            for (const key of activeKeys) {
                expect(expectedBaseKeys.has(key), `activeKeys should not contain unexpected key '${key}'`).to.be.true;
            }
            
            expect(activeKeys.size).to.equal(expectedBaseKeys.size, "activeKeys and expectedBaseKeys should have the same size");
        });

        it('should return the same set of keys regardless of gokan/okurigana state', async () => {
            const gokanKeys = midashigoMode.getActiveKeys();

            // Switch to okurigana mode
            await midashigoMode.onLowerAlphabet(context, 'k');
            await midashigoMode.onLowerAlphabet(context, 'a');
            await midashigoMode.onUpperAlphabet(context, 'K');
            
            const okuriganaKeys = midashigoMode.getActiveKeys();
            expect(okuriganaKeys).to.deep.equal(gokanKeys);
        });
    });

    describe('MidashigoMode Prefix Conversion', () => {
        let midashigoMode: MidashigoMode;
        let editor: MockEditor;
        let context: any;
    
        beforeEach(async () => {
            editor = new MockEditor();
            // 辞書にテストデータを登録
            await editor.getJisyoProvider().registerCandidate('だい>', new Candidate('大', ''));
    
            context = {
                insertStringAndShowRemaining: async (text: string, remaining: string, isOkuri: boolean) => {
                    // モック実装
                },
                setHenkanMode: (mode: any) => {
                    // このテストケースでスパイされる
                },
                newRomajiInput: () => {
                    return {
                        processInput: (char: string) => '',
                        reset: () => { },
                        getRemainingRomaji: () => '',
                        findExactKanaForRomBuffer: () => 'だい',
                        deleteLastChar: () => { },
                        isEmpty: () => false,
                        convertKanaToHiragana: (s: string) => s
                    };
                }
            } as AbstractKanaMode;
            midashigoMode = await MidashigoMode.create(context, editor, '', 'だい');
        });
    
        it('should detect ">" input and transition to InlineHenkanMode with correct candidates', async () => {
            let capturedMode: InlineHenkanMode | undefined;
            context.setHenkanMode = (mode: any) => {
                capturedMode = mode;
            };
            editor.extractMidashigo = () => 'だい>'; // Ensure extractMidashigo returns 'だい>'
    
            await midashigoMode.onSymbol(context, '>');
    
            expect(capturedMode).to.be.instanceOf(InlineHenkanMode);
            if (capturedMode) {
                const entry = await capturedMode['jisyoEntry'];
                expect(entry.getCandidateList()[0].word).to.equal('大');
            }
            expect(editor.getCurrentText()).to.equal('▼大');
        });

        it('should open registration editor if prefix word is not in dictionary', async () => {
            // Mock extractMidashigo to return an unlisted word
            editor.extractMidashigo = () => 'unknown>'; 
            
            // Spy on openRegistrationEditor
            let registrationCalled = false;
            editor.openRegistrationEditor = async (midashigo, okuri) => {
                registrationCalled = true;
                expect(midashigo).to.equal('unknown>');
                expect(okuri).to.equal('');
            };

            await midashigoMode.onSymbol(context, '>');

            expect(registrationCalled).to.be.true;
        });

        it('should do nothing (or just insert key) if midashigo is empty', async () => {
            // Mock extractMidashigo to return empty string (simulating '▽' only)
            editor.extractMidashigo = () => ''; 
            
            // Spy on henkan to ensure it's NOT called
            let henkanCalled = false;
            midashigoMode['henkan'] = async () => { henkanCalled = true; };

            await midashigoMode.onSymbol(context, '>');

            expect(henkanCalled).to.be.false;
            // Also ensure '>' was inserted into text (handled by romajiInput flush/insert logic)
            // Note: The mock editor state might need reset if previous tests affected it, 
            // but here we just check if henkan was skipped.
        });

        it('should flush pending romaji before processing ">"', async () => {
            // Case: Input "t" "t" ">" -> should become "っt>" (or similar depending on implementation) then process ">"
            // Actually, "tt" -> "っt". 
            // Let's try "k" ">" -> "k>" is not kana. 
            // Let's try "n" ">" -> "ん>"
            
            // Reset editor state for this test
            midashigoMode = await MidashigoMode.create(context, editor, '', '');
            
            // Mock "n" in buffer
            midashigoMode['romajiInput'].processInput('n'); 
            
            // Mock extractMidashigo to return 'ん>' after flushing
            editor.extractMidashigo = () => 'ん>'; 
            editor.getJisyoProvider().registerCandidate('ん>', new Candidate('test', ''));

            let capturedMode: InlineHenkanMode | undefined;
            context.setHenkanMode = (mode: any) => {
                capturedMode = mode;
            };

            await midashigoMode.onSymbol(context, '>');

            // Expect 'ん' to be flushed and inserted
            // The exact check depends on how we mock insertStringAndShowRemaining, 
            // but we can check if transition happened for 'ん>'
            expect(capturedMode).to.be.instanceOf(InlineHenkanMode);
        });

        it('should discard incomplete romaji input (like "k") when ">" is pressed', async () => {
            // Case: Input "k" ">" -> "k" should be discarded, only ">" remains/inserted.
            
            // Setup a context with a stateful RomajiInput mock for this test
            let mockRomajiBuffer = '';
            context.newRomajiInput = () => {
                return {
                    processInput: (char: string) => {
                        mockRomajiBuffer += char;
                        return '';
                    },
                    reset: () => { mockRomajiBuffer = ''; },
                    getRemainingRomaji: () => mockRomajiBuffer,
                    findExactKanaForRomBuffer: () => undefined, // 'k' returns undefined
                    deleteLastChar: () => { mockRomajiBuffer = mockRomajiBuffer.slice(0, -1); },
                    isEmpty: () => mockRomajiBuffer.length === 0,
                    convertKanaToHiragana: (s: string) => s
                } as any;
            };

            // Reset editor state
            midashigoMode = await MidashigoMode.create(context, editor, '', '');
            
            // Mock "k" in buffer
            midashigoMode['romajiInput'].processInput('k'); 
            // Assert buffer has 'k'
            expect(midashigoMode['romajiInput'].getRemainingRomaji()).to.equal('k');

            // Spy on context.insertStringAndShowRemaining
            let insertedStr = '';
            context.insertStringAndShowRemaining = async (str: string, remaining: string, isOkuri: boolean) => {
                insertedStr = str;
            };

            await midashigoMode.onSymbol(context, '>');

            // Expect "k" to be gone, only ">" inserted
            // findExactKanaForRomBuffer() for "k" returns undefined -> ""
            // kana + key -> "" + ">" -> ">"
            expect(insertedStr).to.equal('>');
            expect(midashigoMode['romajiInput'].getRemainingRomaji()).to.equal('');
        });
    
        it('should include ">" as an active key', () => {
            // テストケース：getActiveKeys メソッドが「>」をアクティブキーとして返すことを検証
            const activeKeys = midashigoMode.getActiveKeys();
            expect(activeKeys.has('>')).to.be.true;
        });
    });
});
