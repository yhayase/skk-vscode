import * as assert from 'assert';
import { expect } from 'chai';
import * as vscode from 'vscode';

suite('入力モード切り替えにおいて', () => {
    setup('新しい空のエディタを開く', async () => {
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
    });

    teardown('エディタを全て閉じる', async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('初期状態のエディタは空である', () => {
        assert.equal(vscode.window.activeTextEditor?.document.getText(), "");
    });

    test('初期状態のエディタは ascii モードであり、アルファベットの入力がそのままエディタに出力される', async () => {
        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        return new Promise(async (resolve, reject) => {
            const disposable = vscode.workspace.onDidChangeTextDocument(e => {
                disposable.dispose();
                try {
                    expect(e.document.getText()).to.equal("a");
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // ascii モードで a を入力して、 onDidChangeTextDocument イベントを発生させる
            await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");
        });
    });

    test('エディタに Ctrl+J を入力すると、ひらがなモードに切り替わり、アルファベットの入力はひらがなに変換されてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        return new Promise(async (resolve, reject) => {
            const disposable = vscode.workspace.onDidChangeTextDocument(e => {
                disposable.dispose();
                try {
                    // assert.equal(document.getText(), "あ");
                    expect(e.document.getText()).to.equal("あ");
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // ひらがなモードで a を入力することで、 onDidChangeTextDocument イベントを発生させる
            await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");
        });
    });

    test('ひらがなモードで l を入力すると、 ascii モードに切り替わり、アルファベットの入力がそのままエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで l を入力して ascii モードに切り替える
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "l");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        return new Promise(async (resolve, reject) => {
            const disposable = vscode.workspace.onDidChangeTextDocument(e => {
                disposable.dispose();
                try {
                    expect(e.document.getText()).to.equal("a");
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // ascii モードで a を入力することで、 onDidChangeTextDocument イベントを発生させる
            await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");
        });
    });

    test('ひらがなモードで q を入力すると、カタカナモードに切り替わり、アルファベットの入力がカタカナに変換されてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで q を入力してカタカナモードに切り替える
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "q");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        return new Promise(async (resolve, reject) => {
            const disposable = vscode.workspace.onDidChangeTextDocument(e => {
                disposable.dispose();
                try {
                    expect(e.document.getText()).to.equal("ア");
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // カタカナモードで a を入力することで、 onDidChangeTextDocument イベントを発生させる
            await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");
        });
    });

    test('カタカナモードで q を入力すると、ひらがなモードに切り替わり、アルファベットの入力がひらがなに変換されてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで q を入力してカタカナモードに切り替える
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "q");

        // カタカナモードで q を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "q");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        return new Promise(async (resolve, reject) => {
            const disposable = vscode.workspace.onDidChangeTextDocument(e => {
                disposable.dispose();
                try {
                    expect(e.document.getText()).to.equal("あ");
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // ひらがなモードで a を入力することで、 onDidChangeTextDocument イベントを発生させる
            await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");
        });
    });

    test('ひらがなモードで L を入力すると、全英モードに切り替わり、アルファベットの入力が全角文字としてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで L を入力して全英モードに切り替える
        await vscode.commands.executeCommand("skk.upperAlphabetInput", "L");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        return new Promise(async (resolve, reject) => {
            const disposable = vscode.workspace.onDidChangeTextDocument(e => {
                disposable.dispose();
                try {
                    expect(e.document.getText()).to.equal("ａ");
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // 全英モードで a を入力することで、 onDidChangeTextDocument イベントを発生させる
            await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");
        });
    });

    test('カタカナモードで L を入力すると、全英モードに切り替わり、アルファベットの入力が全角文字としてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで q を入力してカタカナモードに切り替える
        await vscode.commands.executeCommand("skk.lowerAlphabetInput", "q");
        // カタカナモードで L を入力して全英モードに切り替える
        await vscode.commands.executeCommand("skk.upperAlphabetInput", "L");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        return new Promise(async (resolve, reject) => {
            const disposable = vscode.workspace.onDidChangeTextDocument(e => {
                disposable.dispose();
                try {
                    expect(e.document.getText()).to.equal("ａ");
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // 全英モードで a を入力することで、 onDidChangeTextDocument イベントを発生させる
            await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");
        });
    });

    test('全英モードで Ctrl+J を押すとひらがなモードに切り替わり、アルファベットの入力はひらがなに変換されてエディタに出力される', async () => {
        // ascii モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");
        // ひらがなモードで L を入力して全英モードに切り替える
        await vscode.commands.executeCommand("skk.upperAlphabetInput", "L");
        // 全英モードで Ctrl+J を入力してひらがなモードに切り替える
        await vscode.commands.executeCommand("skk.ctrlJInput");

        // 直前のコマンドによるエディタの変更が終了するまで待って assert を実行する
        return new Promise(async (resolve, reject) => {
            const disposable = vscode.workspace.onDidChangeTextDocument(e => {
                disposable.dispose();
                try {
                    expect(e.document.getText()).to.equal("あ");
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // ひらがなモードで a を入力することで、 onDidChangeTextDocument イベントを発生させる
            await vscode.commands.executeCommand("skk.lowerAlphabetInput", "a");
        });
    });
});