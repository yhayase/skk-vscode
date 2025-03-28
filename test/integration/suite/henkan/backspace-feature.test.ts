import * as assert from 'assert';
import * as vscode from 'vscode';
import { expect } from 'chai';

suite('バックスペース機能のテスト', () => {
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
            await vscode.commands.executeCommand('skk.spaceInput');
        } else if (char === '\n') {
            await vscode.commands.executeCommand('skk.enterInput');
        } else if (char === '\r') {
            await vscode.commands.executeCommand('skk.ctrlJInput');
        } else if (char === '\b') {
            await vscode.commands.executeCommand('skk.backspaceInput');
        } else if (char === char.toUpperCase()) {
            await vscode.commands.executeCommand('skk.upperAlphabetInput', char);
        } else {
            await vscode.commands.executeCommand('skk.lowerAlphabetInput', char);
        }
        // コマンド実行後の状態変更が反映されるように少し待機
        await new Promise(resolve => setTimeout(resolve, 30));
    }

    test('ASCIIモードでバックスペースを押すと1文字削除される', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // テキストを入力
        await input('a');
        await input('b');
        await input('c');
        
        expect(document?.getText()).to.equal('abc');
        
        // バックスペースで削除
        await input('\b');
        
        expect(document?.getText()).to.equal('ab');
    });

    test('ひらがなモードでバックスペースを押すと1文字削除される', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // ひらがなモードに切り替え
        await input('\r');
        
        // テキストを入力
        await input('a');
        await input('i');
        
        expect(document?.getText()).to.equal('あい');
        
        // バックスペースで削除
        await input('\b');
        
        expect(document?.getText()).to.equal('あ');
    });

    test('ローマ字バッファ中にバックスペースを押すとバッファが消去される', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // ひらがなモードに切り替え
        await input('\r');
        
        // 'k'だけ入力（バッファに残る）
        await input('k');
        
        // まだエディタには何も出力されていない
        expect(document?.getText()).to.equal('');
        
        // バックスペースでバッファを消去
        await input('\b');
        
        // 続けて'a'を入力するとそのままひらがなになる
        await input('a');
        
        expect(document?.getText()).to.equal('あ');
    });
});