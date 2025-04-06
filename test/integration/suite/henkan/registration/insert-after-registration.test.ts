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
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
        await vscode.commands.executeCommand('skk.nop'); // skk 拡張を有効にするための何もしないコマンド呼び出し

        const globalJisyo = getGlobalJisyo();
        globalJisyo?.delete(unexistYomi);
        globalJisyo?.delete(unexistYomi + okuriganaAlphabetConsonant);

        // エディタが開かれるまで待機する
        while (!vscode.window.activeTextEditor) {
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

    test('辞書登録エディタで見出し語を登録すると、元のエディタに登録した単語が挿入される', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);
        const unexistWord = 'かおたへちぶぬもほゃぢめろめちゅのめ';
        const expected = unexistWord;

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

                    const failTimer = setTimeout(() => {
                        // 1秒経過しても unexistWord がエディタに挿入されなかった場合、テストを失敗させる
                        reject(new Error(`document.getText() is expeted to be ${unexistWord} but it is ${document?.getText()}`));
                    }, 1000);

                    // 登録コマンド実行後、元のエディタに戻り、登録した単語が挿入されたことを確認
                    const disposable2 = vscode.window.onDidChangeActiveTextEditor(async editor => {
                        if (editor === undefined) {
                            return;
                        }
                        disposable2.dispose();

                        assert.equal(editor.document, document);
                        const disposable3 = vscode.workspace.onDidChangeTextDocument(async e => {
                            // ignore other document changes
                            if (e.document !== document) {
                                return;
                            }

                            // 元のエディタの内容が登録した単語になっていたならば、テストを成功させる
                            if (document.getText() === expected) {
                                clearTimeout(failTimer); // clear the fail timer
                                resolve();
                            }
                        });

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
        const expected = unexistWord + "さ";

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに、辞書に存在しない語の語幹を入力する
        await vscode.commands.executeCommand('type', { text: unexistYomi });

        // 子音の大文字を入力し、送りがなの区切りとする
        await vscode.commands.executeCommand('skk.upperAlphabetInput', okuriganaAlphabetConsonant.toUpperCase());

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
                    expect(registrationDocument?.getText()).equal(`読み:${unexistYomi}${okuriganaAlphabetConsonant}\n単語:`);

                    await editor.edit(editBuilder => {
                        // append unexistWord to the end of the document
                        const lastLine = registrationDocument.lineAt(registrationDocument.lineCount - 1);
                        const lastChar = lastLine.range.end.character;
                        editBuilder.insert(lastLine.range.end, unexistWord);
                    });

                    // 少しだけ待つ
                    // await new Promise(resolve => setTimeout(resolve, 20));

                    expect(registrationDocument?.getText()).equal(`読み:${unexistYomi}${okuriganaAlphabetConsonant}\n単語:${unexistWord}`);

                    const failTimer = setTimeout(() => {
                        // 1秒経過しても expected がエディタに挿入されなかった場合、テストを失敗させる
                        reject(new Error(`document.getText() is expeted to be ${expected} but it is ${document?.getText()}`));
                    }, 1000);

                    // 登録コマンド実行後、元のエディタに戻り、登録した単語が挿入されたことを確認
                    const disposable2 = vscode.window.onDidChangeActiveTextEditor(async editor => {
                        if (editor === undefined) {
                            return;
                        }
                        disposable2.dispose();

                        assert.equal(editor.document, document);
                        const disposable3 = vscode.workspace.onDidChangeTextDocument(async e => {
                            // ignore other document changes
                            if (e.document !== document) {
                                return;
                            }

                            // 元のエディタの内容が登録した単語+送りがなになっていたならば、テストを成功させる
                            if (document.getText() === expected) {
                                clearTimeout(failTimer); // clear the fail timer
                                disposable3.dispose(); // dispose the event listener
                                resolve();
                            }
                        });

                    });

                    // 辞書登録コマンドを実行
                    await vscode.commands.executeCommand('skk.registerMidashigo');
                } catch (error) {
                    reject(error);
                }
            });

            // 送り仮名の母音を入力して、変換を開始する
            vscode.commands.executeCommand('skk.lowerAlphabetInput', okuriganaAlphabetVowel);
        });
    });

    test('InlineHenkanMode から登録タブを開いて登録した場合、元のエディタに登録した単語が送り仮名つきで挿入される', async function () {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);
        const unexistWord = 'かおたへちぶぬ';
        const existWord = '候補1';
        const expected = unexistWord + "さ";

        // 辞書に1つだけ候補を登録する（InlineHenkanModeに入るため）
        getGlobalJisyo().set(unexistYomi + okuriganaAlphabetConsonant, [{ word: existWord, annotation: undefined }]);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに、辞書に存在する語の語幹を入力する
        await vscode.commands.executeCommand('type', { text: unexistYomi });

        // 子音の大文字を入力し、送りがなの区切りとする
        await vscode.commands.executeCommand('skk.upperAlphabetInput', okuriganaAlphabetConsonant.toUpperCase());

        // 新しいエディタが開かれ、内容が辞書登録の初期コンテンツであることを確認する
        return new Promise(async (resolve, reject) => {
            // 送り仮名の母音を入力して、変換を開始する（InlineHenkanModeに入る）
            await vscode.commands.executeCommand('skk.lowerAlphabetInput', okuriganaAlphabetVowel);

            // 変換候補が表示されたら、スペースキーを入力して次の候補に進む
            // 候補が1つしかないので、これで辞書登録エディタが開く
            const disposable1 = vscode.workspace.onDidChangeTextDocument(async e => {
                if (e.document !== document) {
                    return;
                }
                disposable1.dispose();

                // スペースキーを入力して、辞書登録エディタを開く
                await vscode.commands.executeCommand('skk.spaceInput');
            });

            // 辞書登録エディタが開かれたら実行する処理
            const disposable2 = vscode.window.onDidChangeActiveTextEditor(async editor => {
                if (editor === undefined) {
                    return;
                }
                disposable2.dispose();
                const registrationDocument = editor?.document;
                try {
                    // 辞書登録エディタが開かれていることを確認
                    expect(registrationDocument?.getText()).equal(`読み:${unexistYomi}${okuriganaAlphabetConsonant}\n単語:`);

                    await editor.edit(editBuilder => {
                        // append unexistWord to the end of the document
                        const lastLine = registrationDocument.lineAt(registrationDocument.lineCount - 1);
                        editBuilder.insert(lastLine.range.end, unexistWord);
                    });

                    expect(registrationDocument?.getText()).equal(`読み:${unexistYomi}${okuriganaAlphabetConsonant}\n単語:${unexistWord}`);

                    const failTimer = setTimeout(() => {
                        // 5秒経過しても expected がエディタに挿入されなかった場合、テストを失敗させる
                        reject(new Error(`document.getText() is expeted to be ${expected} but it is ${document?.getText()}`));
                    }, 5000);

                    // 登録コマンド実行後、元のエディタに戻り、登録した単語が挿入されたことを確認
                    const disposable3 = vscode.window.onDidChangeActiveTextEditor(async editor => {
                        if (editor === undefined) {
                            return;
                        }
                        disposable3.dispose();

                        assert.equal(editor.document, document);
                        const disposable4 = vscode.workspace.onDidChangeTextDocument(async e => {
                            // ignore other document changes
                            if (e.document !== document) {
                                return;
                            }

                            // 元のエディタの内容が登録した単語+送りがなになっていたならば、テストを成功させる
                            if (document.getText() === expected) {
                                clearTimeout(failTimer); // clear the fail timer
                                disposable4.dispose(); // dispose the event listener
                                resolve();
                            }
                        });
                    });

                    // 辞書登録コマンドを実行
                    await vscode.commands.executeCommand('skk.registerMidashigo');
                } catch (error) {
                    reject(error);
                }
            });
        });
    });

    test('MenuHenkanMode から登録タブを開いて登録した場合、元のエディタに登録した単語が送り仮名つきで挿入される', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);
        const unexistWord = 'かおたへちぶぬ';
        const expected = unexistWord + "さ";

        // 辞書に4つ以上の候補を登録する（MenuHenkanModeに入るため）
        const existWords = ['候補1', '候補2', '候補3', '候補4'];
        // 最初の候補を設定
        getGlobalJisyo().set(unexistYomi + okuriganaAlphabetConsonant,
            [{ word: existWords[0], annotation: undefined },
            { word: existWords[1], annotation: undefined },
            { word: existWords[2], annotation: undefined },
            { word: existWords[3], annotation: undefined }]);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに、辞書に存在する語の語幹を入力する
        await vscode.commands.executeCommand('type', { text: unexistYomi });

        // 子音の大文字を入力し、送りがなの区切りとする
        await vscode.commands.executeCommand('skk.upperAlphabetInput', okuriganaAlphabetConsonant.toUpperCase());

        // 新しいエディタが開かれ、内容が辞書登録の初期コンテンツであることを確認する
        return new Promise(async (resolve, reject) => {
            // 変換候補が表示されたら、スペースキーを入力してMenuHenkanModeに入る
            const disposable1 = vscode.workspace.onDidChangeTextDocument(async e => {
                if (e.document !== document) {
                    return;
                }
                disposable1.dispose();

                // スペースキーを 3 回入力して、InlineHenkanModeからMenuHenkanModeに入る
                await vscode.commands.executeCommand('skk.spaceInput');
                while (e.document.getText() !== `▼${existWords[1]}`) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                await vscode.commands.executeCommand('skk.spaceInput');
                while (e.document.getText() !== `▼${existWords[2]}`) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                await vscode.commands.executeCommand('skk.spaceInput');
                while (e.document.getText() !== `▼`) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }

                // MenuHenkanModeに入ったら、スペースキーを入力して辞書登録エディタを開く
                await vscode.commands.executeCommand('skk.spaceInput');
            });

            // 辞書登録エディタが開かれたら実行する処理
            const disposable2 = vscode.window.onDidChangeActiveTextEditor(async editor => {
                if (editor === undefined) {
                    return;
                }
                disposable2.dispose();
                const registrationDocument = editor.document;
                try {
                    // 辞書登録エディタが開かれていることを確認
                    expect(registrationDocument.getText()).equal(`読み:${unexistYomi}${okuriganaAlphabetConsonant}\n単語:`);

                    await editor.edit(editBuilder => {
                        // append unexistWord to the end of the document
                        const lastLine = registrationDocument.lineAt(registrationDocument.lineCount - 1);
                        editBuilder.insert(lastLine.range.end, unexistWord);
                    });

                    while (registrationDocument?.getText() !== `読み:${unexistYomi}${okuriganaAlphabetConsonant}\n単語:${unexistWord}`) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }

                    const failTimer = setTimeout(() => {
                        // 1秒経過しても expected がエディタに挿入されなかった場合、テストを失敗させる
                        reject(new Error(`document.getText() is expeted to be ${expected} but it is ${document?.getText()}`));
                    }, 1000);

                    const disposable4 = vscode.workspace.onDidChangeTextDocument(async e => {
                        // ignore other document changes
                        if (e.document !== document) {
                            return;
                        }

                        const text = document.getText();
                        // 元のエディタの内容が登録した単語+送りがなになっていたならば、テストを成功させる
                        if (document.getText() === expected) {
                            clearTimeout(failTimer); // clear the fail timer
                            disposable4.dispose(); // dispose the event listener
                            resolve();
                        }
                    });
                    // 辞書登録コマンドを実行
                    await vscode.commands.executeCommand('skk.registerMidashigo');
                } catch (error) {
                    reject(error);
                }
            });
            // 送り仮名の母音を入力して、変換を開始する（InlineHenkanModeに入る）
            await vscode.commands.executeCommand('skk.lowerAlphabetInput', okuriganaAlphabetVowel);
        });
    });
});
