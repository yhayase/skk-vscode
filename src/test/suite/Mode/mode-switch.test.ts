import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Switching between modes test', () => {
    setup('Open a new empty editor', async () => {
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
    });

    teardown('Close the opened editor', async () => {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('エディタは初期状態は空である', () => {
        assert.equal(vscode.window.activeTextEditor?.document.getText(), "");
    });

    test('初期状態のエディタは ascii モードであり、アルファベットの入力がそのままエディタに出力される', async () => {
        // ascii モードで a を入力する
        await vscode.commands.executeCommand("skk-vscode.lowerAlphabetInput", "a");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        let document = vscode.window.activeTextEditor?.document;
        return new Promise(resolve => {
            let disposable = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === document) {
                    disposable.dispose();
                    assert.equal(vscode.window.activeTextEditor?.document.getText(), "a");
                    resolve();
                }
            });
        });
    });

    test('エディタに Ctrl+J を入力すると、ひらがなモードに切り替わり、アルファベットの入力はひらがなに変換されてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk-vscode.ctrlJInput");
        // ひらがなモードで a を入力する
        await vscode.commands.executeCommand("skk-vscode.lowerAlphabetInput", "a");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        let document = vscode.window.activeTextEditor?.document;
        return new Promise(resolve => {
            let disposable = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === document) {
                    disposable.dispose();
                    assert.equal(vscode.window.activeTextEditor?.document.getText(), "あ");
                    resolve();
                }
            });
        });
    });

    test('ひらがなモードで l を入力すると、 ascii モードに切り替わり、アルファベットの入力がそのままエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk-vscode.ctrlJInput");
        // ひらがなモードで l を入力して ascii モードに切り替える
        await vscode.commands.executeCommand("skk-vscode.lowerAlphabetInput", "l");

        // ascii モードで a を入力する
        await vscode.commands.executeCommand("skk-vscode.lowerAlphabetInput", "a");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        let document = vscode.window.activeTextEditor?.document;
        return new Promise(resolve => {
            let disposable = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === document) {
                    disposable.dispose();
                    assert.equal(vscode.window.activeTextEditor?.document.getText(), "a");
                    resolve();
                }
            });
        });
    });
});
