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
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        let document = vscode.window.activeTextEditor?.document;
        return new Promise(resolve => {
            let disposable = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === document) {
                    disposable.dispose();
                    assert.equal(document.getText(), "a");
                    resolve();
                }
            });
        });
    });

    test('エディタに Ctrl+J を入力すると、ひらがなモードに切り替わり、アルファベットの入力はひらがなに変換されてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで a を入力する
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        let document = vscode.window.activeTextEditor?.document;
        return new Promise(resolve => {
            let disposable = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === document) {
                    disposable.dispose();
                    assert.equal(document.getText(), "あ");
                    resolve();
                }
            });
        });
    });

    test('ひらがなモードで l を入力すると、 ascii モードに切り替わり、アルファベットの入力がそのままエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで l を入力して ascii モードに切り替える
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "l");

        // ascii モードで a を入力する
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        let document = vscode.window.activeTextEditor?.document;
        return new Promise(resolve => {
            let disposable = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === document) {
                    disposable.dispose();
                    assert.equal(document.getText(), "a");
                    resolve();
                }
            });
        });
    });

    test('ひらがなモードで q を入力すると、カタカナモードに切り替わり、アルファベットの入力がカタカナに変換されてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで q を入力してカタカナモードに切り替える
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "q");

        // カタカナモードで a を入力する
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        let document = vscode.window.activeTextEditor?.document;
        return new Promise(resolve => {
            let disposable = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === document) {
                    disposable.dispose();
                    assert.equal(document.getText(), "ア");
                    resolve();
                }
            });
        });
    });

    test('カタカナモードで q を入力すると、ひらがなモードに切り替わり、アルファベットの入力がひらがなに変換されてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで q を入力してカタカナモードに切り替える
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "q");

        // カタカナモードで q を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "q");

        // ひらがなモードで a を入力する
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        let document = vscode.window.activeTextEditor?.document;
        return new Promise(resolve => {
            let disposable = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === document) {
                    disposable.dispose();
                    assert.equal(document.getText(), "あ");
                    resolve();
                }
            });
        });
    });

    test('ひらがなモードで L を入力すると、全英モードに切り替わり、アルファベットの入力が全角文字としてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで L を入力して全英モードに切り替える
        await vscode.commands.executeCommand("skk.upperAlphabetInput", "L");

        // 全英モードで a を入力する
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        let document = vscode.window.activeTextEditor?.document;
        return new Promise(resolve => {
            let disposable = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === document) {
                    disposable.dispose();
                    assert.equal(document.getText(), "ａ");
                    resolve();
                }
            });
        });
    });

    test('カタカナモードで L を入力すると、全英モードに切り替わり、アルファベットの入力が全角文字としてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで q を入力してカタカナモードに切り替える
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "q");
        // カタカナモードで L を入力して全英モードに切り替える
        await vscode.commands.executeCommand("skk.upperAlphabetInput", "L");

        // 全英モードで a を入力する
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        let document = vscode.window.activeTextEditor?.document;
        return new Promise(resolve => {
            let disposable = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === document) {
                    disposable.dispose();
                    assert.equal(document.getText(), "ａ");
                    resolve();
                }
            });
        });
    });

    test('全英モードで Ctrl+J を押すとひらがなモードに切り替わり、アルファベットの入力はひらがなに変換されてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで L を入力して全英モードに切り替える
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "L");
        // 全英モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");

        // ひらがなモードで a を入力する
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        let document = vscode.window.activeTextEditor?.document;
        return new Promise(resolve => {
            let disposable = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === document) {
                    disposable.dispose();
                    assert.equal(document.getText(), "あ");
                    resolve();
                }
            });
        });
    });
});