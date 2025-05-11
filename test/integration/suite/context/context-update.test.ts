import * as assert from 'assert';
import * as vscode from 'vscode';
import { expect } from 'chai';

suite('Context Update on Mode Change', () => {
    setup('新しい空のエディタを開き、SKK拡張を有効にする', async () => {
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');

        // Wait for the editor to be active
        while (!vscode.window.activeTextEditor) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Activate SKK extension and wait for activation to complete
        const skkExtension = vscode.extensions.getExtension('hayase.skk'); // Use publisher.extensionName
        if (!skkExtension) {
            throw new Error('SKK extension not found');
        }
        await skkExtension.activate();

        // Give some time for initial context setting after activation
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    teardown('エディタを閉じる', async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    // Helper function to get context values using the test command
    async function getSkkContexts(...keys: string[]): Promise<{ [key: string]: any }> {
        // Add 'skk.mode' to the keys to always check the mode
        const allKeys = Array.from(new Set(['skk.mode', ...keys]));
        const contextValues = await vscode.commands.executeCommand('skk.getSkkContextsForTest', allKeys);
        return contextValues as { [key: string]: any };
    }

    test('Initial mode should be ascii and context should be updated', async () => {
        const contexts = await getSkkContexts('skk.activeKey.a', 'skk.activeKey.ctrl_j', 'skk.activeKey.space');

        expect(contexts['skk.mode']).to.equal('ascii', 'Initial mode context should be ascii');
        expect(contexts['skk.activeKey.a']).to.be.false;
        expect(contexts['skk.activeKey.ctrl_j']).to.be.true;
        expect(contexts['skk.activeKey.space']).to.be.false;
    });

    test('Mode should change to hiragana on Ctrl+J and contexts should update', async () => {
        // Start in AsciiMode (verified in previous test or setup)
        let contexts = await getSkkContexts('skk.activeKey.a', 'skk.activeKey.ctrl_j', 'skk.activeKey.space');
        expect(contexts['skk.mode']).to.equal('ascii');

        // Press Ctrl+J
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Wait for mode change and context update
        await new Promise(resolve => setTimeout(resolve, 100)); // Give time for async context setting

        contexts = await getSkkContexts('skk.activeKey.a', 'skk.activeKey.ctrl_j', 'skk.activeKey.space');
        expect(contexts['skk.mode']).to.equal('hiragana:kakutei', 'Mode context should be hiragana:kakutei after Ctrl+J');

        // In Hiragana:Kakutei mode, 'a' and 'space' should be active, ctrl+j should still be active
        expect(contexts['skk.activeKey.a']).to.be.true;
        expect(contexts['skk.activeKey.space']).to.be.true;
        expect(contexts['skk.activeKey.ctrl_j']).to.be.true; // Ctrl+J is active in both modes for transition
    });

    test('Mode should change to katakana on q in Hiragana mode and contexts should update', async () => {
        // Start in Hiragana:Kakutei mode (transition via Ctrl+J first)
        await vscode.commands.executeCommand('skk.ctrlJInput');
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for mode change

        let contexts = await getSkkContexts('skk.activeKey.a', 'skk.activeKey.space', 'skk.activeKey.q');
        expect(contexts['skk.mode']).to.equal('hiragana:kakutei');

        // Press q
        await vscode.commands.executeCommand('skk.lowerAlphabetInput', 'q');

        // Wait for mode change and context update
        await new Promise(resolve => setTimeout(resolve, 100)); // Give time for async context setting

        contexts = await getSkkContexts('skk.activeKey.a', 'skk.activeKey.space', 'skk.activeKey.q');
        expect(contexts['skk.mode']).to.equal('katakana:kakutei', 'Mode context should be katakana:kakutei after q');

        // In Katakana:Kakutei mode, 'a' and 'space' should be active, q should still be active
        expect(contexts['skk.activeKey.a']).to.be.true;
        expect(contexts['skk.activeKey.space']).to.be.true;
        expect(contexts['skk.activeKey.q']).to.be.true; // q is active in both kana modes for transition
    });

    // TODO: Add more tests for other mode transitions and internal state changes
    // (e.g., entering MidashigoMode, InlineHenkanMode, MenuHenkanMode, AbbrevMode, CandidateDeletionMode)
    // and verify the active keys in each state.
});
