import * as assert from 'assert';
import * as vscode from 'vscode';
import { expect } from 'chai';

suite('文章の変換において', async () => {
    setup('新しい空のエディタを開く', async () => {
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
        await vscode.commands.executeCommand('skk.nop'); // skk 拡張を有効にするための何もしないコマンド呼び出し
    });

    teardown('エディタを閉じる', async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    async function input(char: string) {
        expect(char.length).to.equal(1);
        if (char === ' ') {
            vscode.commands.executeCommand('skk.spaceInput');
            await new Promise(resolve => setTimeout(resolve, 50));
        } else if (char === '\n') {
            vscode.commands.executeCommand('skk.enterInput');
            await new Promise(resolve => setTimeout(resolve, 50));
        } else if (char === '\r') {
            vscode.commands.executeCommand('skk.ctrlJInput');
            await new Promise(resolve => setTimeout(resolve, 50));
        } else if (char === char.toUpperCase()) {
            vscode.commands.executeCommand('skk.upperAlphabetInput', char);
            await new Promise(resolve => setTimeout(resolve, 50));
        } else {
            vscode.commands.executeCommand('skk.lowerAlphabetInput', char);
            await new Promise(resolve => setTimeout(resolve, (char === 'q') ? 50 : 30));
        }
    }

    test('長い入力を正しく変換できる', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');
        await new Promise(resolve => setTimeout(resolve, 30));

        // 以下のパターンを含む文を入力する
        // * 送りあり → 次に大文字
        // * 送りなし → Ctrl+J
        // * 送りなし → q でカタカナに
        // * 送りなし → 変換せずに Ctrl+J
        // * 送りあり → 改行
        // * 送りあり → 次に小文字
        for (const char of 'SubayaIChairo \rnoKitsuneqhaInu\rwoToBi\nKoEru') {
            await input(char);
        }

        // 結果を検証
        
        // const expectedText = '素早い茶色のキツネはいぬを飛び\n越える';
        // expect(document?.getText()).to.equal(expectedText);

        // 辞書によって変換結果が異なるため、漢字部分は任意文字列として正規表現で検証する
        const expectedRegexp = /.+い.+のキツネはいぬを.+び\n.+える/;
        expect(document?.getText()).to.match(expectedRegexp);

        return;
    });
});