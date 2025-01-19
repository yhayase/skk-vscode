import * as assert from 'assert';
import * as vscode from 'vscode';
import { getGlobalJisyo } from '../../../../jisyo/jisyo';

suite('Registration feature test', async () => {
    const unexistYomi = 'りですごじめわゅょぼざゔにろせふよふ';

    setup('新しい空のエディタを開き、見出し語が登録されていない状態にする', async () => {
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');

        await vscode.commands.executeCommand('skk.nop');
        const globalJisyo = getGlobalJisyo();
        globalJisyo?.delete(unexistYomi);
    });

    teardown('エディタを閉じ、登録された不要な見出し語を削除する', async () => {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

        await vscode.commands.executeCommand('skk.nop');
        const globalJisyo = getGlobalJisyo();
        globalJisyo?.delete(unexistYomi);
    });

    test('存在しない見出し語を変換しようとすると、辞書登録エディタが開く', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに，辞書に存在しない語の読みを入力する
        await vscode.commands.executeCommand('type', { text: unexistYomi });

        // スペースキーを入力して、見出し語の変換を試みる
        await vscode.commands.executeCommand('skk.spaceInput');

        // 新しいエディタが開かれ、内容が辞書登録の初期コンテンツであることを確認する
        return new Promise(resolve => {
            const disposable = vscode.workspace.onDidChangeTextDocument(async e => {
                if (e.document !== document) {
                    disposable.dispose();
                    assert.equal(e.document.getText(), `読み:${unexistYomi}\n単語:`);
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    resolve();
                }
            });
        });
    });

    test('辞書登録エディタで見出し語を登録すると、ユーザ辞書に見出し語が登録される', async () => {
        const unexistWord = 'かおたへちぶぬもほゃぢめろめちゅのめ';

        // 念のため、現在のドキュメントが空であることを確認する
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);
        assert.equal(document?.getText(), '');

        // 辞書登録のフォーマットでテキストを入力し， registerCandidate コマンドを実行する
        await vscode.commands.executeCommand('type', { text: `読み:${unexistYomi}\n単語:${unexistWord}` });
        await vscode.commands.executeCommand('skk.registerCandidate');

        // ユーザ辞書に登録されたことを確認する
        const candidate = getGlobalJisyo()?.get(unexistYomi);
        assert.notEqual(candidate, undefined);
        assert.equal(candidate?.length, 1);
        assert.equal(candidate?.[0].word, unexistWord);
        assert.equal(candidate?.[0].annotation, undefined);
    });
});
