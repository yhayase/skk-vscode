import * as assert from 'assert';
import * as vscode from 'vscode';
import { expect } from 'chai';
import { closeAllEditorsAndWait, openNewUntitledFileAndWait } from '../testHelper';

suite('文章の変換において', async () => {
    setup('新しい空のエディタを開く', async () => {
        await openNewUntitledFileAndWait();
    });

    teardown('エディタを閉じる', async () => {
        await closeAllEditorsAndWait();
    });

    async function input(char: string) {
        expect(char.length).to.equal(1);
        if (char === ' ') {
            await vscode.commands.executeCommand('skk.spaceInput');
        } else if (char === '\n') {
            await vscode.commands.executeCommand('skk.enterInput');
        } else if (char === '\r') {
            await vscode.commands.executeCommand('skk.ctrlJInput');
        } else if (char === char.toUpperCase()) {
            await vscode.commands.executeCommand('skk.upperAlphabetInput', char);
        } else {
            await vscode.commands.executeCommand('skk.lowerAlphabetInput', char);
        }
        await new Promise(resolve => setTimeout(resolve, 25));
    }

    test('長い入力を正しく変換できる', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

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