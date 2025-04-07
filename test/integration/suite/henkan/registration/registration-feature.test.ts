import * as assert from 'assert';
import * as vscode from 'vscode';
import { getGlobalJisyo } from '../../../../../src/lib/skk/jisyo/jisyo';
import { expect } from 'chai';

suite('辞書登録機能において', async () => {
    const unexistYomi = 'りですごじめわゅょぼざうにろせふよふ';
    const unexistKatakanaYomi = 'リデスゴジメワュョボザウニロセフヨフ';
    const okuriganaAlphabetConsonant = 's';
    const okuriganaAlphabetVowel = 'a';

    setup('新しい空のエディタを開き、見出し語が登録されていない状態にする', async () => {
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
        await vscode.commands.executeCommand('skk.nop'); // skk 拡張を有効にするための何もしないコマンド呼び出し

        const globalJisyo = getGlobalJisyo();
        globalJisyo?.delete(unexistYomi);
        globalJisyo?.delete(unexistYomi + okuriganaAlphabetConsonant);

        // エディタが開かれるまで待機する
        while (! vscode.window.activeTextEditor) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    });

    teardown('エディタを閉じ、登録された不要な見出し語を削除する', async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await vscode.commands.executeCommand('skk.nop'); // skk 拡張を有効にするための何もしないコマンド呼び出し

        const globalJisyo = getGlobalJisyo();
        globalJisyo?.delete(unexistYomi);
        globalJisyo?.delete(unexistYomi + okuriganaAlphabetConsonant);
    });

    test('存在しない送りなし見出し語を変換しようとすると、辞書登録エディタが開く', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに，辞書に存在しない語の読みを入力する
        await vscode.commands.executeCommand('type', { text: unexistYomi });

        // 新しいエディタが開かれ、内容が辞書登録の初期コンテンツであることを確認する
        return new Promise((resolve, reject) => {
            const disposable = vscode.workspace.onDidOpenTextDocument(async newDocument => {
                disposable.dispose();
                try {
                    assert.equal(newDocument.getText(), `読み:${unexistYomi}\n単語:`);
                    vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // スペースキーを入力して、見出し語の変換を試みる
            vscode.commands.executeCommand('skk.spaceInput');
            // onDidOpenTextDocument が発火するはず
        });
    });

    test('存在しない送りあり見出し語を変換しようとすると、辞書登録エディタが開く', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに，辞書に存在しない語の読みの語感を入力する
        await vscode.commands.executeCommand('type', { text: unexistYomi });

        // 子音の大文字を入力し、送りがなの区切りとする
        await vscode.commands.executeCommand('skk.upperAlphabetInput', okuriganaAlphabetConsonant.toUpperCase());

        // 新しいエディタが開かれ、内容が辞書登録の初期コンテンツであることを確認する
        return new Promise((resolve, reject) => {
            const disposable1 = vscode.workspace.onDidOpenTextDocument(async newDocument => {
                disposable1.dispose();
                try {
                    expect(newDocument.getText()).equal(`読み:${unexistYomi + okuriganaAlphabetConsonant}\n単語:`);
                    // vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // 送り仮名の母音を入力して、変換を開始する
            vscode.commands.executeCommand('skk.lowerAlphabetInput', okuriganaAlphabetVowel);
        });
    });

    test('存在する送りなし見出し語候補の最後まで到達すると、辞書登録エディタが開く', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // unexistYomi に対応する候補を1つ登録する
        const existWord = '候補1';
        getGlobalJisyo().set(unexistYomi, [{ word: existWord, annotation: undefined }]);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに，辞書に存在しない語の読みを入力する
        await vscode.commands.executeCommand('type', { text: unexistYomi });

        // 次の入力によって、1つ目の候補が表示されたら実行する処理
        const disposable1 = vscode.workspace.onDidChangeTextDocument(e => {
            disposable1.dispose();
            // 1つ目の候補が出ている状態で、さらにスペースキーを入力する
            vscode.commands.executeCommand('skk.spaceInput');

            // 候補の最後でスペースを押したので onDidOpenTextDocument が呼ばれるはずである
        });

        // 2回目のスペース入力によって新しいエディタが開かれ、内容が辞書登録の初期コンテンツであることを確認する
        return new Promise((resolve, reject) => {
            const disposable = vscode.workspace.onDidOpenTextDocument(async newDocument => {
                disposable.dispose();
                try {
                    expect(newDocument).not.equal(document, '新しいエディタが開かれている');
                    expect(newDocument.getText()).equal(`読み:${unexistYomi}\n単語:`);
                    vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // スペースキーを入力して、見出し語の変換を開始する
            vscode.commands.executeCommand('skk.spaceInput');
            // 1つ目の候補が表示され、 onDidChangeTextDocument が呼ばれるはずである
        });
    });

    test('カタカナで入力した存在する送りなし見出し語候補の最後まで到達すると、辞書登録エディタが開く', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // unexistYomi に対応する候補を1つ登録する
        const existWord = '候補1';
        getGlobalJisyo().set(unexistYomi, [{ word: existWord, annotation: undefined }]);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // カタカナモードに切り替える
        await vscode.commands.executeCommand('skk.lowerAlphabetInput', 'q');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに，辞書に存在しない語の読みを入力する
        await vscode.commands.executeCommand('type', { text: unexistKatakanaYomi });

        // スペースキーを入力して、見出し語の変換を開始する
        await vscode.commands.executeCommand('skk.spaceInput');

        // 次の入力によって、1つ目の候補が表示されたら実行する処理
        const disposable1 = vscode.workspace.onDidChangeTextDocument(e => {
            disposable1.dispose();
            // 1つ目の候補が出ている状態で、さらにスペースキーを入力する
            vscode.commands.executeCommand('skk.spaceInput');

            // 候補の最後でスペースを押したので onDidOpenTextDocument が呼ばれるはずである
        });

        // 2回目のスペース入力によって新しいエディタが開かれ、内容が辞書登録の初期コンテンツであることを確認する
        return new Promise((resolve, reject) => {
            const disposable = vscode.workspace.onDidOpenTextDocument(async newDocument => {
                disposable.dispose();
                try {
                    expect(newDocument.getText()).equal(`読み:${unexistYomi}\n単語:`);
                    vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // スペースキーを入力して、見出し語の変換を開始する
            vscode.commands.executeCommand('skk.spaceInput');
            // 1つ目の候補が表示され、 onDidChangeTextDocument が呼ばれるはずである
        });
    });

    test('存在する送りあり見出し語候補の最後まで到達すると、辞書登録エディタが開く', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // 存在しない送りなし見出し語の候補を1つ登録する
        const existWord = '候補1';
        getGlobalJisyo().set(unexistYomi + okuriganaAlphabetConsonant, [{ word: existWord, annotation: undefined }]);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに，辞書に存在しない語の語幹を入力する
        await vscode.commands.executeCommand('type', { text: unexistYomi });

        // エディタに，辞書に存在しない語の読みの送り仮名を入力し、変換を開始する
        await vscode.commands.executeCommand('skk.upperAlphabetInput', okuriganaAlphabetConsonant.toUpperCase());
        // 新しいエディタが開かれ、内容が辞書登録の初期コンテンツであることを確認する
        return new Promise(async (resolve, reject) => {
            //const disposable1 = vscode.workspace.onDidOpenTextDocument(async document => {
            const disposable1 = vscode.window.onDidChangeActiveTextEditor(async editor => {
                if (editor === undefined) {
                    // 既存のエディタからスコープが外れただけ。次のイベントを待つ
                    return;
                }

                disposable1.dispose();
                try {
                    expect(editor.document.getText()).equal(`読み:${unexistYomi + okuriganaAlphabetConsonant}\n単語:`);
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            const disposable2 = await vscode.workspace.onDidChangeTextDocument(async e => {
                disposable2.dispose();
                // 1つ目の候補が出ている状態で、さらにスペースキーを入力する
                await vscode.commands.executeCommand('skk.spaceInput');
            });

            // 送り仮名の母音を入力して、変換を開始する
            await vscode.commands.executeCommand('skk.lowerAlphabetInput', okuriganaAlphabetVowel);
        });
    });

    test('辞書登録エディタで見出し語を登録すると、ユーザ辞書に見出し語が登録される', async () => {
        const unexistWord = 'かおたへちぶぬもほゃぢめろめちゅのめ';

        // 辞書登録のフォーマットに従ったテキストを入力する
        await vscode.commands.executeCommand('type', { text: `読み:${unexistYomi}\n単語:${unexistWord}` });

        return new Promise((resolve, reject) => {
            const disposable = vscode.workspace.onDidCloseTextDocument(async closedDocument => {
                disposable.dispose();

                try {
                    // ユーザ辞書に登録されたことを確認する
                    const candidate = getGlobalJisyo()?.get(unexistYomi);
                    expect(candidate).not.equal(undefined);
                    expect(candidate?.length).equal(1);
                    expect(candidate?.[0].word).equal(unexistWord);
                    expect(candidate?.[0].annotation).equal(undefined);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // 辞書登録機能を呼び出すと、辞書登録が実行されてエディタが閉じられる
            vscode.commands.executeCommand('skk.registerMidashigo');
            // onDidCloseTextDocument が発火するはず
        });

    });

});
