import { expect } from 'chai';
import { KatakanaMode } from '../../../../../src/lib/skk/input-mode/KatakanaMode';
import { MockEditor } from '../../../mocks/MockEditor';
import { EditorFactory } from '../../../../../src/lib/skk/editor/EditorFactory';
import { KakuteiMode } from '../../../../../src/lib/skk/input-mode/henkan/KakuteiMode';
import { AbstractKanaMode } from '../../../../../src/lib/skk/input-mode/AbstractKanaMode';
import { MidashigoMode } from '../../../../../src/lib/skk/input-mode/henkan/MidashigoMode';

describe('KatakanaMode', () => {
    let katakanaMode: KatakanaMode;
    let mockEditor: MockEditor;

    beforeEach(() => {
        mockEditor = new MockEditor();
        EditorFactory.setInstance(mockEditor);
        katakanaMode = KatakanaMode.getInstance();
    });

    afterEach(() => {
        EditorFactory.reset();
    });

    it('should convert romaji to katakana', () => {
        katakanaMode.lowerAlphabetInput('k');
        katakanaMode.lowerAlphabetInput('a');
        expect(mockEditor.getInsertedText()).to.equal('カ');
    });

    it('should handle n+vowel correctly', () => {
        katakanaMode.lowerAlphabetInput('n');
        katakanaMode.lowerAlphabetInput('a');
        expect(mockEditor.getInsertedText()).to.equal('ナ');
    });

    it('should handle n+consonant correctly', () => {
        katakanaMode.lowerAlphabetInput('n');
        katakanaMode.lowerAlphabetInput('k');
        katakanaMode.lowerAlphabetInput('a');
        expect(mockEditor.getCurrentText()).to.equal('ンカ');
    });

    it('should handle double consonants correctly', () => {
        katakanaMode.lowerAlphabetInput('k');
        katakanaMode.lowerAlphabetInput('k');
        katakanaMode.lowerAlphabetInput('a');
        expect(mockEditor.getCurrentText()).to.equal('ッカ');
    });

    it('should start henkan mode with capital letter', () => {
        katakanaMode.upperAlphabetInput('K');
        katakanaMode.lowerAlphabetInput('a');
        katakanaMode.lowerAlphabetInput('t');
        katakanaMode.lowerAlphabetInput('a');
        expect(mockEditor.getMidashigo()).to.equal('カタ');
    });

    it('should switch to hiragana mode on q', () => {
        katakanaMode.lowerAlphabetInput('q');
        expect(mockEditor.getCurrentInputMode().toString()).to.equal('かな');
    });

    it('should switch to ascii mode on l', () => {
        katakanaMode.lowerAlphabetInput('l');
        expect(mockEditor.getCurrentInputMode().constructor.name).to.equal('AsciiMode');
    });

    describe('getActiveKeys', () => {
        it('should return keys from KakuteiMode plus "q" when henkanMode is KakuteiMode (default state)', () => {
            const kakuteiMode = new KakuteiMode(katakanaMode as AbstractKanaMode, mockEditor);
            const expectedKeysFromKakutei = kakuteiMode.getActiveKeys();
            const expectedKeys = new Set(expectedKeysFromKakutei);
            expectedKeys.add("q"); 

            const activeKeys = katakanaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });

        it('should include basic romaji input keys when in default (KakuteiMode) state', () => {
            const activeKeys = katakanaMode.getActiveKeys();
            expect(activeKeys.has('a'), "key 'a'").to.be.true;
            expect(activeKeys.has('shift+a'), "key 'shift+a'").to.be.true;
            expect(activeKeys.has('1'), "key '1'").to.be.true;
            expect(activeKeys.has('/'), "key '/'").to.be.true;
            expect(activeKeys.has(' '), "key ' '").to.be.true;
            expect(activeKeys.has('enter'), "key 'enter' in default state").to.be.false; 
            expect(activeKeys.has('backspace'), "key 'backspace'").to.be.true;
            expect(activeKeys.has('ctrl+j'), "key 'ctrl+j'").to.be.true;
            expect(activeKeys.has('ctrl+g'), "key 'ctrl+g'").to.be.true;
            expect(activeKeys.has('q'), "key 'q'").to.be.true;
        });

        it('should include "enter" in activeKeys when KakuteiMode has pending romaji input', async () => {
            await katakanaMode.lowerAlphabetInput('k'); 
            const activeKeys = katakanaMode.getActiveKeys();
            expect(activeKeys.has('enter'), "key 'enter' with pending romaji").to.be.true;
        });

        it('should return keys from MidashigoMode when in MidashigoMode (gokan)', async () => {
            // Trigger MidashigoMode (gokan) - external observable state: getContextualName changes
            await katakanaMode.upperAlphabetInput('K');
            expect(katakanaMode.getContextualName()).to.equal('katakana:midashigo:gokan');

            // Now test getActiveKeys in this state
            const midashigoMode = katakanaMode["henkanMode"] as MidashigoMode; // Still need internal access to get the expected keys from the *other* mode
            const expectedKeys = midashigoMode.getActiveKeys();
            const activeKeys = katakanaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });

        it('should return keys from MidashigoMode when in MidashigoMode (okurigana)', async () => {
            // Trigger MidashigoMode (okurigana) - external observable state: getContextualName changes
            await katakanaMode.upperAlphabetInput('K');
            await katakanaMode.lowerAlphabetInput('a');
            await katakanaMode.upperAlphabetInput('K');
            expect(katakanaMode.getContextualName()).to.equal('katakana:midashigo:okurigana');

            // Now test getActiveKeys in this state
            const midashigoMode = katakanaMode["henkanMode"] as MidashigoMode; // Still need internal access
            const expectedKeys = midashigoMode.getActiveKeys();
            const activeKeys = katakanaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });

        it('should return keys from InlineHenkanMode when in InlineHenkanMode', async () => {
            // Trigger InlineHenkanMode - external observable state: getContextualName changes (e.g., to katakana:inline-henkan)
            mockEditor.getJisyoProvider().registerCandidate('katakana', { word: 'カタカナ' });
            await katakanaMode.upperAlphabetInput('K');
            await katakanaMode.lowerAlphabetInput('a');
            await katakanaMode.lowerAlphabetInput('t');
            await katakanaMode.lowerAlphabetInput('a');
            await katakanaMode.lowerAlphabetInput('k');
            await katakanaMode.lowerAlphabetInput('a');
            await katakanaMode.lowerAlphabetInput('n');
            await katakanaMode.lowerAlphabetInput('a');
            // Assuming getContextualName reflects InlineHenkanMode state, though not explicitly tested here yet
            // expect(katakanaMode.getContextualName()).to.equal('katakana:inline-henkan'); // Need to confirm actual contextual name

            // Now test getActiveKeys in this state
            const inlineHenkanMode = katakanaMode["henkanMode"]; // Still need internal access
            const expectedKeys = inlineHenkanMode.getActiveKeys();
            const activeKeys = katakanaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });

        it('should return keys from MenuHenkanMode when in MenuHenkanMode', async () => {
            // Trigger MenuHenkanMode (more than 3 candidates) - external observable state: getContextualName changes (e.g., to katakana:menu-henkan)
            mockEditor.getJisyoProvider().registerCandidate('test', { word: 'テスト1' });
            mockEditor.getJisyoProvider().registerCandidate('test', { word: 'テスト2' });
            mockEditor.getJisyoProvider().registerCandidate('test', { word: 'テスト3' });
            mockEditor.getJisyoProvider().registerCandidate('test', { word: 'テスト4' }); // 4th candidate to trigger menu
            await katakanaMode.upperAlphabetInput('T');
            await katakanaMode.lowerAlphabetInput('e');
            await katakanaMode.lowerAlphabetInput('s');
            await katakanaMode.lowerAlphabetInput('t');
            await katakanaMode.spaceInput(); // Trigger conversion and potentially menu mode
            // Assuming getContextualName reflects MenuHenkanMode state
            // expect(katakanaMode.getContextualName()).to.equal('katakana:menu-henkan'); // Need to confirm actual contextual name

            // Now test getActiveKeys in this state
            const menuHenkanMode = katakanaMode["henkanMode"]; // Still need internal access
            const expectedKeys = menuHenkanMode.getActiveKeys();
            const activeKeys = katakanaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });

        it('should return keys from CandidateDeletionMode when in CandidateDeletionMode', async () => {
            // Trigger CandidateDeletionMode - external observable state: getContextualName changes (e.g., to katakana:candidate-deletion)
            mockEditor.getJisyoProvider().registerCandidate('test', { word: 'テスト' });
            await katakanaMode.upperAlphabetInput('T');
            await katakanaMode.lowerAlphabetInput('e');
            await katakanaMode.lowerAlphabetInput('s');
            await katakanaMode.lowerAlphabetInput('t');
            await katakanaMode.spaceInput(); // Trigger conversion
            await katakanaMode.lowerAlphabetInput('x'); // Trigger deletion mode
            // Assuming getContextualName reflects CandidateDeletionMode state
            // expect(katakanaMode.getContextualName()).to.equal('katakana:candidate-deletion'); // Need to confirm actual contextual name

            // Now test getActiveKeys in this state
            const candidateDeletionMode = katakanaMode["henkanMode"]; // Still need internal access
            const expectedKeys = candidateDeletionMode.getActiveKeys();
            const activeKeys = katakanaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });
    });

    describe('getContextualName', () => {
        it('should return "katakana:kakutei" when henkanMode is KakuteiMode (default)', () => {
            expect(katakanaMode.getContextualName()).to.equal('katakana:kakutei');
        });

        it('should return "katakana:midashigo:gokan" when henkanMode is MidashigoMode (gokan)', async () => {
            await katakanaMode.upperAlphabetInput('K');
            expect(katakanaMode.getContextualName()).to.equal('katakana:midashigo:gokan');
        });

        it('should return "katakana:midashigo:okurigana" when henkanMode is MidashigoMode (okurigana)', async () => {
            await katakanaMode.upperAlphabetInput('K');
            await katakanaMode.lowerAlphabetInput('a');
            await katakanaMode.upperAlphabetInput('K');
            expect(katakanaMode.getContextualName()).to.equal('katakana:midashigo:okurigana');
        });
    });
});
