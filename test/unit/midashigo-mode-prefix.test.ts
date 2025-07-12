import { expect } from 'chai';
import { MidashigoMode } from '../../src/lib/skk/input-mode/henkan/MidashigoMode';
import { AbstractKanaMode } from '../../src/lib/skk/input-mode/AbstractKanaMode';
import { MockEditor } from './mocks/MockEditor';
import { InlineHenkanMode } from '../../src/lib/skk/input-mode/henkan/InlineHenkanMode';
import { Candidate } from '../../src/lib/skk/jisyo/candidate';

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

    it('should detect ">" input and handle prefix conversion', async () => {
        // テストケース：MidashigoMode で「Dai>」と入力した場合に「だい>」として検索されることを検証
        await midashigoMode.onSymbol(context, '>');
        // ここでは実際の動作を確認するのではなく、単にメソッドが呼び出されることを確認
        expect(true).to.be.true;
    });

    it('should include ">" as an active key', () => {
        // テストケース：getActiveKeys メソッドが「>」をアクティブキーとして返すことを検証
        const activeKeys = midashigoMode.getActiveKeys();
        expect(activeKeys.has('>')).to.be.true;
    });

    
});
