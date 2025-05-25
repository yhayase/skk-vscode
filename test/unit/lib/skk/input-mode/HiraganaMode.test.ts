import { expect } from 'chai';
import { HiraganaMode } from '../../../../../src/lib/skk/input-mode/HiraganaMode';
import { MockEditor } from '../../../mocks/MockEditor';
import { MidashigoMode, MidashigoType } from '../../../../../src/lib/skk/input-mode/henkan/MidashigoMode';
import { EditorFactory } from '../../../../../src/lib/skk/editor/EditorFactory';
import { KakuteiMode } from '../../../../../src/lib/skk/input-mode/henkan/KakuteiMode';
import { AbstractKanaMode } from '../../../../../src/lib/skk/input-mode/AbstractKanaMode';

describe('HiraganaMode', () => {
    let hiraganaMode: HiraganaMode;
    let mockEditor: MockEditor;

    beforeEach(() => {
        mockEditor = new MockEditor();
        EditorFactory.setInstance(mockEditor); // Setup EditorFactory for modes that use it
        hiraganaMode = HiraganaMode.getInstance(); // Use getInstance as per class design
        // AbstractKanaMode constructor calls this.editor.setInputMode,
        // but HiraganaMode itself doesn't directly call setInputMode on mockEditor in its constructor.
        // If direct setInputMode is needed for mockEditor state, it should be explicit.
        // For now, assume HiraganaMode correctly initializes its internal editor via EditorFactory.
    });

    afterEach(() => {
        EditorFactory.reset(); // Clean up EditorFactory
    });

    it('should convert romaji to hiragana', () => {
        hiraganaMode.lowerAlphabetInput('k');
        hiraganaMode.lowerAlphabetInput('a');
        expect(mockEditor.getInsertedText()).to.equal('か');
    });

    it('should handle n+vowel correctly', () => {
        hiraganaMode.lowerAlphabetInput('n');
        hiraganaMode.lowerAlphabetInput('a');
        expect(mockEditor.getInsertedText()).to.equal('な');
    });

    it('should handle n+consonant correctly', () => {
        hiraganaMode.lowerAlphabetInput('n');
        hiraganaMode.lowerAlphabetInput('k');
        hiraganaMode.lowerAlphabetInput('a');
        expect(mockEditor.getCurrentText()).to.equal('んか');
    });

    it('should handle double consonants correctly', () => {
        hiraganaMode.lowerAlphabetInput('k');
        hiraganaMode.lowerAlphabetInput('k');
        hiraganaMode.lowerAlphabetInput('a');
        expect(mockEditor.getCurrentText()).to.equal('っか');
    });

    it('should start henkan mode with capital letter', () => {
        hiraganaMode.upperAlphabetInput('K');
        hiraganaMode.lowerAlphabetInput('a');
        hiraganaMode.lowerAlphabetInput('n');
        hiraganaMode.lowerAlphabetInput('j');
        hiraganaMode.lowerAlphabetInput('i');
        expect(mockEditor.getMidashigo()).to.equal('かんじ');
    });

    it('should switch to katakana mode on q', () => {
        hiraganaMode.lowerAlphabetInput('q');
        expect(mockEditor.getCurrentInputMode().toString()).to.equal('カナ');
    });

    it('should switch to ascii mode on l', () => {
        hiraganaMode.lowerAlphabetInput('l');
        expect(mockEditor.getCurrentInputMode().constructor.name).to.equal('AsciiMode');
    });

    describe('Integration test: Unfixed n followed by uppercase letter', () => {
        it('should handle "n" correctly in MidashigoMode when followed by uppercase consonant', async () => {
            mockEditor.getJisyoProvider().registerCandidate('かn', { word: '兼' });
            mockEditor.getJisyoProvider().registerCandidate('かんs', { word: '関' });

            // "kan" を入力
            await hiraganaMode.upperAlphabetInput('K');
            await hiraganaMode.lowerAlphabetInput('a');
            await hiraganaMode.lowerAlphabetInput('n');

            // "S" を入力（送り仮名モードに切り替わる）
            await hiraganaMode.upperAlphabetInput('S');

            // 「か」が語幹、「ん」が送り仮名として解釈される欠陥があった。
            // 本来はこの時点ではまだ MidashigoMode であり、「かん」が語幹、「s」が入力途中の送り仮名となっている
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('▽かん'); // 「s」はannotationとして表示される

            // "u" を入力（送り仮名として）
            await hiraganaMode.lowerAlphabetInput('u');

            expect(mockEditor.getCurrentText()).to.equal('▼関'); // 「す」はannotationとして表示される
            expect(mockEditor.getAppendedSuffix()).to.equal('す');
            // 変換が行われていることを確認
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('InlineHenkanMode');
        });

        it('should handle "n" correctly in MidashigoMode when followed by uppercase vowel', async () => {
            mockEditor.getJisyoProvider().registerCandidate('かn', { word: '兼' });
            mockEditor.getJisyoProvider().registerCandidate('かんe', { word: '缶' });

            // "kan" を入力
            await hiraganaMode.upperAlphabetInput('K');
            await hiraganaMode.lowerAlphabetInput('a');
            await hiraganaMode.lowerAlphabetInput('n');
            // "E" を入力（送り仮名モードに切り替わる）
            await hiraganaMode.upperAlphabetInput('E');
            // 「か」が語幹、「ね」が送り仮名として解釈される欠陥があった。
            // 本来は「かん」が語幹、「え」が送り仮名として変換が開始される
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('InlineHenkanMode');
            expect(mockEditor.getCurrentText()).to.equal('▼缶'); // 「え」は送り仮名として表示される
            expect(mockEditor.getAppendedSuffix()).to.equal('え');
        });

        it('should handle consonant correctly in KakuteiMode when followed by uppercase vowel', async () => {
            await hiraganaMode.lowerAlphabetInput('k');
            await hiraganaMode.upperAlphabetInput('A');

            // 「k」が捨てられて、「あ」だけで見出し語モードが開始する欠陥があった。
            // 正しくは、「か」で見出し語モードが開始する
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('▽か');
        });

        it('should handle consonant correctly in KakuteiMode when followed by same uppercase consonant', async () => {
            await hiraganaMode.lowerAlphabetInput('s');
            await hiraganaMode.upperAlphabetInput('S');

            // 最初の「s」が捨てられて、2つ目の「s」だけで見出し語モードが開始する欠陥があった。
            // 「っ」と未確定の「s」で見出し語モードが開始する
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('▽っ');
            expect(mockEditor.getRemainingRomaji()).to.equal('s');
        });

        it('should handle "n" correctly in KakuteiMode when followed by uppercase vowel', async () => {
            await hiraganaMode.lowerAlphabetInput('n');
            await hiraganaMode.upperAlphabetInput('I');

            // 他の子音と異なり、 n に続いて母音が入力された場合は、「ん」が確定して、母音のみで見出し語モードが開始しなければならない。
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('ん▽い');
        });

        it('should handle "n" correctly in KakuteiMode when followed by other uppercase consonant', async () => {
            await hiraganaMode.lowerAlphabetInput('n');
            await hiraganaMode.upperAlphabetInput('K');

            // 「ん」が捨てられて、「か」で見出し語モードが開始する欠陥があった。
            // 正しくは、「ん」と未確定の「k」で見出し語モードが開始する
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('ん▽');
            expect(mockEditor.getRemainingRomaji()).to.equal('k');
        });

        it('should handle "n" correctly in KakuteiMode when followed by uppercase N', async () => {
            await hiraganaMode.lowerAlphabetInput('n');
            await hiraganaMode.upperAlphabetInput('N');

            // 「ん」が捨てられて、「n」で見出し語モードが開始する欠陥があった。
            // 正しくは、「ん」と未確定の「n」で見出し語モードが開始する
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');
            expect(mockEditor.getCurrentText()).to.equal('ん▽');
            expect(mockEditor.getRemainingRomaji()).to.equal('n');
        });
    });

    describe('Integration test: Returning to MidashigoMode from okuri-ari midashigo conversion', () => {
        it('should be in gokan mode when returning from okuri-ari midashigo conversion', async () => {
            mockEditor.getJisyoProvider().registerCandidate('あu', { word: '合' });

            // "AU" を入力して InlineHenkanMode に遷移
            await hiraganaMode.upperAlphabetInput('A');
            await hiraganaMode.upperAlphabetInput('U');

            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('InlineHenkanMode');

            // x を入力して MidashigoMode に戻る
            await hiraganaMode.lowerAlphabetInput('x');
            expect(hiraganaMode["henkanMode"].constructor.name).to.equal('MidashigoMode');

            // DDSKK 互換の振舞いとして、送り仮名は語幹に追加される
            expect(mockEditor.getCurrentText()).to.equal('▽あう');

            // midashigoMode は gokan でなければならない
            expect((hiraganaMode["henkanMode"] as MidashigoMode)["midashigoMode"]).to.equal(MidashigoType.gokan, 'should be in gokan mode');
        });
    });

    describe('getActiveKeys', () => {
        it('should return keys from KakuteiMode plus "q" when henkanMode is KakuteiMode (default state)', () => {
            // HiraganaMode initializes with KakuteiMode internally
            const kakuteiMode = new KakuteiMode(hiraganaMode as AbstractKanaMode, mockEditor);
            const expectedKeysFromKakutei = kakuteiMode.getActiveKeys();
            const expectedKeys = new Set(expectedKeysFromKakutei);
            expectedKeys.add("q"); // AbstractKanaMode adds 'q'

            const activeKeys = hiraganaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });

        it('should include basic romaji input keys when in default (KakuteiMode) state', () => {
            const activeKeys = hiraganaMode.getActiveKeys();
            // Check for a few representative keys from KakuteiMode's expected set
            expect(activeKeys.has('a'), "key 'a'").to.be.true;
            expect(activeKeys.has('shift+a'), "key 'shift+a'").to.be.true;
            expect(activeKeys.has('1'), "key '1'").to.be.true;
            expect(activeKeys.has('/'), "key '/'").to.be.true;
            expect(activeKeys.has(' '), "key ' '").to.be.true;
            // In default KakuteiMode (no pending romaji), 'enter' is NOT active by default
            // as treatEnterKey would be false.
            expect(activeKeys.has('enter'), "key 'enter' in default state").to.be.false; 
            expect(activeKeys.has('backspace'), "key 'backspace'").to.be.true;
            expect(activeKeys.has('ctrl+j'), "key 'ctrl+j'").to.be.true;
            expect(activeKeys.has('ctrl+g'), "key 'ctrl+g'").to.be.true;
            expect(activeKeys.has('q'), "key 'q' (added by AbstractKanaMode)").to.be.true;
        });

        // TODO: Add tests for getActiveKeys when HiraganaMode is in other internal henkan states
        // (e.g., MidashigoMode, InlineHenkanMode) once those modes also implement getActiveKeys.

        it('should include "enter" in activeKeys when KakuteiMode has pending romaji input', async () => {
            // Simulate typing 'k' which should make 'enter' active in KakuteiMode
            // because treatEnterKey becomes true.
            await hiraganaMode.lowerAlphabetInput('k'); 
            
            const activeKeys = hiraganaMode.getActiveKeys();
            expect(activeKeys.has('enter'), "key 'enter' with pending romaji").to.be.true;
        });

        it('should return keys from MidashigoMode when in MidashigoMode (gokan)', async () => {
            // Trigger MidashigoMode (gokan) - external observable state: getContextualName changes
            await hiraganaMode.upperAlphabetInput('K');
            expect(hiraganaMode.getContextualName()).to.equal('hiragana:midashigo:gokan');

            // Now test getActiveKeys in this state
            const midashigoMode = hiraganaMode["henkanMode"] as MidashigoMode; // Still need internal access to get the expected keys from the *other* mode
            const expectedKeys = midashigoMode.getActiveKeys();
            const activeKeys = hiraganaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });

        it('should return keys from MidashigoMode when in MidashigoMode (okurigana)', async () => {
            // Trigger MidashigoMode (okurigana) - external observable state: getContextualName changes
            await hiraganaMode.upperAlphabetInput('K');
            await hiraganaMode.lowerAlphabetInput('a');
            await hiraganaMode.upperAlphabetInput('K');
            expect(hiraganaMode.getContextualName()).to.equal('hiragana:midashigo:okurigana');

            // Now test getActiveKeys in this state
            const midashigoMode = hiraganaMode["henkanMode"] as MidashigoMode; // Still need internal access
            const expectedKeys = midashigoMode.getActiveKeys();
            const activeKeys = hiraganaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });

        it('should return keys from InlineHenkanMode when in InlineHenkanMode', async () => {
            // Trigger InlineHenkanMode - external observable state: getContextualName changes (e.g., to hiragana:inline-henkan)
            mockEditor.getJisyoProvider().registerCandidate('kanji', { word: '漢字' });
            await hiraganaMode.upperAlphabetInput('K');
            await hiraganaMode.lowerAlphabetInput('a');
            await hiraganaMode.lowerAlphabetInput('n');
            await hiraganaMode.lowerAlphabetInput('j');
            await hiraganaMode.lowerAlphabetInput('i');
            // Assuming getContextualName reflects InlineHenkanMode state, though not explicitly tested here yet
            // expect(hiraganaMode.getContextualName()).to.equal('hiragana:inline-henkan'); // Need to confirm actual contextual name

            // Now test getActiveKeys in this state
            const inlineHenkanMode = hiraganaMode["henkanMode"]; // Still need internal access
            const expectedKeys = inlineHenkanMode.getActiveKeys();
            const activeKeys = hiraganaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });

        it('should return keys from MenuHenkanMode when in MenuHenkanMode', async () => {
            // Trigger MenuHenkanMode (more than 3 candidates) - external observable state: getContextualName changes (e.g., to hiragana:menu-henkan)
            mockEditor.getJisyoProvider().registerCandidate('test', { word: 'テスト1' });
            mockEditor.getJisyoProvider().registerCandidate('test', { word: 'テスト2' });
            mockEditor.getJisyoProvider().registerCandidate('test', { word: 'テスト3' });
            mockEditor.getJisyoProvider().registerCandidate('test', { word: 'テスト4' }); // 4th candidate to trigger menu
            await hiraganaMode.upperAlphabetInput('T');
            await hiraganaMode.lowerAlphabetInput('e');
            await hiraganaMode.lowerAlphabetInput('s');
            await hiraganaMode.lowerAlphabetInput('t');
            await hiraganaMode.spaceInput(); // Trigger conversion and potentially menu mode
            // Assuming getContextualName reflects MenuHenkanMode state
            // expect(hiraganaMode.getContextualName()).to.equal('hiragana:menu-henkan'); // Need to confirm actual contextual name

            // Now test getActiveKeys in this state
            const menuHenkanMode = hiraganaMode["henkanMode"]; // Still need internal access
            const expectedKeys = menuHenkanMode.getActiveKeys();
            const activeKeys = hiraganaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });

        it('should return keys from CandidateDeletionMode when in CandidateDeletionMode', async () => {
            // Trigger CandidateDeletionMode - external observable state: getContextualName changes (e.g., to hiragana:candidate-deletion)
            mockEditor.getJisyoProvider().registerCandidate('test', { word: 'テスト' });
            await hiraganaMode.upperAlphabetInput('T');
            await hiraganaMode.lowerAlphabetInput('e');
            await hiraganaMode.lowerAlphabetInput('s');
            await hiraganaMode.lowerAlphabetInput('t');
            await hiraganaMode.spaceInput(); // Trigger conversion
            await hiraganaMode.lowerAlphabetInput('x'); // Trigger deletion mode
            // Assuming getContextualName reflects CandidateDeletionMode state
            // expect(hiraganaMode.getContextualName()).to.equal('hiragana:candidate-deletion'); // Need to confirm actual contextual name

            // Now test getActiveKeys in this state
            const candidateDeletionMode = hiraganaMode["henkanMode"]; // Still need internal access
            const expectedKeys = candidateDeletionMode.getActiveKeys();
            const activeKeys = hiraganaMode.getActiveKeys();
            expect(activeKeys).to.deep.equal(expectedKeys);
        });
    });

    describe('getContextualName', () => {
        it('should return "hiragana:kakutei" when henkanMode is KakuteiMode (default)', () => {
            // HiraganaMode initializes with KakuteiMode
            expect(hiraganaMode.getContextualName()).to.equal('hiragana:kakutei');
        });

        it('should return "hiragana:midashigo:gokan" when henkanMode is MidashigoMode (gokan)', async () => {
            // Trigger MidashigoMode by typing an uppercase letter
            await hiraganaMode.upperAlphabetInput('K');
            // At this point, the internal henkanMode of hiraganaMode should be MidashigoMode,
            // and MidashigoMode itself should be in 'gokan' state initially.
            expect(hiraganaMode.getContextualName()).to.equal('hiragana:midashigo:gokan');
        });

        it('should return "hiragana:midashigo:okurigana" when henkanMode is MidashigoMode (okurigana)', async () => {
            await hiraganaMode.upperAlphabetInput('K'); // Enter Midashigo (gokan)
            await hiraganaMode.lowerAlphabetInput('a'); // Add to gokan part of midashigo ('ka')
            await hiraganaMode.upperAlphabetInput('K'); // Enter okurigana part of midashigo
            expect(hiraganaMode.getContextualName()).to.equal('hiragana:midashigo:okurigana');
        });
    });
});
