import * as assert from 'assert';
import * as vscode from 'vscode';
import { getGlobalJisyo } from '../../../../../src/lib/skk/jisyo/jisyo';
import { expect } from 'chai';

suite('辞書登録単語挿入機能において', async () => {
    const unexistYomi = 'りですごじめわゅょぼざうにろせふよふ';
    const unexistKatakanaYomi = 'リデスゴジメワュョボザウニロセフヨフ';
    const okuriganaAlphabetConsonant = 's';
    const okuriganaAlphabetVowel = 'a';

    setup('新しい空のエディタを開き、見出し語が登録されていない状態にする', async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
        await vscode.commands.executeCommand('skk.nop'); // skk 拡張を有効にするための何もしないコマンド呼び出し

        const globalJisyo = getGlobalJisyo();
        globalJisyo?.delete(unexistYomi);
        globalJisyo?.delete(unexistYomi + okuriganaAlphabetConsonant);
    });

    teardown('エディタを閉じ、登録された不要な見出し語を削除する', async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await vscode.commands.executeCommand('skk.nop'); // skk 拡張を有効にするための何もしないコマンド呼び出し

        const globalJisyo = getGlobalJisyo();
        globalJisyo?.delete(unexistYomi);
        globalJisyo?.delete(unexistYomi + okuriganaAlphabetConsonant);
    });

    test('辞書登録エディタで見出し語を登録すると、元のエディタに登録した単語が挿入される', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);
        const unexistWord = 'かおたへちぶぬもほゃぢめろめちゅのめ';

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに、辞書に存在しない語の読みを入力する
        await vscode.commands.executeCommand('type', { text: unexistYomi });

        // 新しいエディタが開かれ、内容が辞書登録の初期コンテンツであることを確認する
        return new Promise(async (resolve, reject) => {
            const disposable1 = vscode.window.onDidChangeActiveTextEditor(async editor => {
                if (editor === undefined) {
                    return;
                }
                disposable1.dispose();
                const registrationDocument = editor?.document;
                try {
                    // 辞書登録エディタが開かれていることを確認
                    expect(registrationDocument?.getText()).equal(`読み:${unexistYomi}\n単語:`);

                    await editor.edit(editBuilder => {
                        // append unexistWord to the end of the document
                        const lastLine = registrationDocument.lineAt(registrationDocument.lineCount - 1);
                        const lastChar = lastLine.range.end.character;
                        editBuilder.insert(lastLine.range.end, unexistWord);
                    });

                    // 少しだけ待つ
                    // await new Promise(resolve => setTimeout(resolve, 20));

                    expect(registrationDocument?.getText()).equal(`読み:${unexistYomi}\n単語:${unexistWord}`);

                    // 登録コマンド実行後、元のエディタに戻り、登録した単語が挿入されたことを確認
                    const disposable2 = vscode.window.onDidChangeActiveTextEditor(async editor => {
                        if (editor === undefined) {
                            return;
                        }
                        disposable2.dispose();

                        assert.equal(editor.document, document);
                        try {
                            // 元のエディタの内容が登録した単語になっていることを確認
                            expect(document?.getText()).equal(unexistWord);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    });

                    // 辞書登録コマンドを実行
                    await vscode.commands.executeCommand('skk.registerMidashigo');
                } catch (error) {
                    reject(error);
                }
            });

            // スペースキーを入力して、辞書登録エディタを開く
            await vscode.commands.executeCommand('skk.spaceInput');
        });
    });

    test('送りありの見出し語の場合、登録した単語に送り仮名が付加されて挿入される', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);
        const unexistWord = 'かおたへちぶぬ';

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに、辞書に存在しない語の語幹を入力する
        await vscode.commands.executeCommand('type', { text: unexistYomi });

        // 子音の大文字を入力し、送りがなの区切りとする
        await vscode.commands.executeCommand('skk.upperAlphabetInput', okuriganaAlphabetConsonant.toUpperCase());

        // 新しいエディタが開かれ、内容が辞書登録の初期コンテンツであることを確認する
        return new Promise((resolve, reject) => {
            const disposable1 = vscode.window.onDidChangeActiveTextEditor(async editor => {
                if (editor === undefined) {
                    return;
                }
                disposable1.dispose();
                const registrationDocument = editor?.document;
                try {
                    // 辞書登録エディタが開かれていることを確認
                    expect(registrationDocument.getText()).equal(`読み:${unexistYomi + okuriganaAlphabetConsonant}\n単語:`);

                    // 単語を入力
                    await editor.edit(editBuilder => {
                        // append unexistWord to the end of the document
                        const lastLine = registrationDocument.lineAt(registrationDocument.lineCount - 1);
                        const lastChar = lastLine.range.end.character;
                        editBuilder.insert(lastLine.range.end, unexistWord);
                    });

                    // 登録コマンド実行後、元のエディタに戻り、登録した単語が送り仮名付きで挿入されたことを確認
                    const disposable2 = vscode.window.onDidChangeActiveTextEditor(editor => {
                        if (editor === undefined) {
                            return;
                        }
                        disposable2.dispose();

                        assert.equal(editor.document, document);
                        try {
                            // 元のエディタの内容が登録した単語＋送り仮名になっていることを確認
                            // 送り仮名は "さ" になるはず（sとaのローマ字入力）
                            expect(document?.getText()).equal(unexistWord + 'さ');
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    });

                    // 辞書登録コマンドを実行
                    await vscode.commands.executeCommand('skk.registerMidashigo');

                    // 送り仮名の母音を入力
                    await vscode.commands.executeCommand('skk.lowerAlphabetInput', okuriganaAlphabetVowel);
                } catch (error) {
                    reject(error);
                }
            });

            // 送り仮名の母音を入力して、変換を開始する
            vscode.commands.executeCommand('skk.lowerAlphabetInput', okuriganaAlphabetVowel);
        });
    });
});