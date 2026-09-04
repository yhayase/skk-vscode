import * as assert from 'assert';
import * as vscode from 'vscode';
import { getGlobalJisyo } from '../../../../src/lib/skk/jisyo/jisyo';
import { expect } from 'chai';
import { closeAllEditorsAndWait, openNewUntitledFileAndWait, waitForDocumentContent } from '../testHelper';

suite('候補削除機能において', async () => {
    const existYomi = 'りですごじわゅょぼざごうにろせふよふ';
    const existKatakanaYomi = 'リデスゴジワュョボザゴウニロセフヨフ';
    const candidateWord = 'ほいウ4ホチグハオシルア';
    const okuriganaAlphabetConsonant = 's';
    const okuriganaAlphabetVowel = 'a';

    setup('新しい空のエディタを開き、見出し語が登録された状態にする', async () => {
        await openNewUntitledFileAndWait();

        const globalJisyo = getGlobalJisyo();
        globalJisyo?.delete(existYomi);
        globalJisyo?.delete(existYomi + okuriganaAlphabetConsonant);
        globalJisyo?.set(existYomi, [{ word: candidateWord, annotation: undefined }]);
        globalJisyo?.set(existYomi + okuriganaAlphabetConsonant, [{ word: candidateWord, annotation: undefined }]);
    });

    teardown('エディタを閉じ、登録された不要な見出し語を削除する', async () => {
        await closeAllEditorsAndWait();

        const globalJisyo = getGlobalJisyo();
        globalJisyo?.delete(existYomi);
        globalJisyo?.delete(existYomi + okuriganaAlphabetConsonant);
    });

    test('ひらがなで入力した見出し語をインライン変換しているときに X を押すと削除モードになり、Y を押すと候補が削除される', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに、候補が1つだけの見出し語を入力する
        await vscode.commands.executeCommand('type', { text: existYomi });
        await waitForDocumentContent(document, existYomi);

        return new Promise(async (resolve, reject) => {
            try {
                const disposable1 = vscode.workspace.onDidChangeTextDocument(async e => {
                    disposable1.dispose();
                    const disposable2 = vscode.workspace.onDidChangeTextDocument(async e => {
                        disposable2.dispose();
                        const disposable3 = vscode.workspace.onDidChangeTextDocument(async e => {
                            disposable3.dispose();
                            try {
                                // テキストエディタが空になっていることを確認する
                                expect(document?.getText()).equal('');
                                // ユーザ辞書から候補が削除されていることを確認する
                                const candidate = getGlobalJisyo()?.get(existYomi);
                                expect(candidate).equal(undefined);

                                resolve();
                            } catch (err) {
                                reject(err);
                            }
                        });

                        try {
                            // Y を入力して、候補を削除する
                            await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Y');
                        } catch (err) {
                            reject(err);
                        }
                    });

                    try {
                        // X を入力して、候補削除のモードに入る
                        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'X');
                    } catch (err) {
                        reject(err);
                    }
                });

                // スペースキーを入力して、見出し語の変換を試みる
                await vscode.commands.executeCommand('skk.spaceInput');
            } catch (err) {
                reject(err);
            }
        });
    });

    test('カタカナで入力した見出し語をインライン変換しているときに X を押すと削除モードになり、Y を押すと候補が削除される', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // カタカナモードに切り替える
        await vscode.commands.executeCommand('skk.lowerAlphabetInput', 'q');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに、候補が1つだけの見出し語をカタカナで入力する
        await vscode.commands.executeCommand('type', { text: existKatakanaYomi });
        await waitForDocumentContent(document, existKatakanaYomi);

        return new Promise(async (resolve, reject) => {
            try {
                const disposable1 = vscode.workspace.onDidChangeTextDocument(async e => {
                    disposable1.dispose();
                    const disposable2 = vscode.workspace.onDidChangeTextDocument(async e => {
                        disposable2.dispose();
                        const disposable3 = vscode.workspace.onDidChangeTextDocument(async e => {
                            disposable3.dispose();
                            try {
                                // テキストエディタが空になっていることを確認する
                                expect(document?.getText()).equal('');
                                // ユーザ辞書から候補が削除されていることを確認する
                                const candidate = getGlobalJisyo()?.get(existYomi);
                                expect(candidate).equal(undefined);

                                resolve();
                            } catch (err) {
                                reject(err);
                            }
                        });

                        try {
                            // Y を入力して、候補を削除する
                            await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Y');
                        } catch (err) {
                            reject(err);
                        }
                    });

                    try {
                        // X を入力して、候補削除のモードに入る
                        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'X');
                    } catch (err) {
                        reject(err);
                    }
                });

                // スペースキーを入力して、見出し語の変換を試みる
                await vscode.commands.executeCommand('skk.spaceInput');
            } catch (err) {
                reject(err);
            }
        });
    });

    test('送りありの見出し語をインライン変換しているときに X を押すと削除モードになり、Y を押すと候補が削除される', async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.notEqual(document, undefined);

        // ひらがなモードに切り替える
        await vscode.commands.executeCommand('skk.ctrlJInput');

        // Q キーを入力して、見出し語モードに切り替える
        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Q');

        // エディタに、候補が1つだけの見出し語を入力する
        await vscode.commands.executeCommand('type', { text: existYomi });
        await waitForDocumentContent(document, existYomi);

        // 送りがなの子音を入力する
        await vscode.commands.executeCommand('skk.upperAlphabetInput', okuriganaAlphabetConsonant.toUpperCase());

        return new Promise(async (resolve, reject) => {
            try {
                const disposable1 = vscode.workspace.onDidChangeTextDocument(async e => {
                    disposable1.dispose();
                    const disposable2 = vscode.workspace.onDidChangeTextDocument(async e => {
                        disposable2.dispose();
                        const disposable3 = vscode.workspace.onDidChangeTextDocument(async e => {
                            disposable3.dispose();
                            try {
                                // テキストエディタが空になっていることを確認する
                                expect(document?.getText()).equal('');
                                // ユーザ辞書から候補が削除されていることを確認する
                                const candidate = getGlobalJisyo()?.get(existYomi + okuriganaAlphabetConsonant);
                                expect(candidate).equal(undefined);

                                resolve();
                            } catch (err) {
                                reject(err);
                            }
                        });

                        try {
                            // Y を入力して、候補を削除する
                            await vscode.commands.executeCommand('skk.upperAlphabetInput', 'Y');
                        } catch (err) {
                            reject(err);
                        }
                    });

                    try {
                        // X を入力して、候補削除のモードに入る
                        await vscode.commands.executeCommand('skk.upperAlphabetInput', 'X');
                    } catch (err) {
                        reject(err);
                    }
                });

                // 送りがなの母音を入力して、見出し語の変換を試みる
                await vscode.commands.executeCommand('skk.lowerAlphabetInput', okuriganaAlphabetVowel);
            } catch (err) {
                reject(err);
            }
        });
    });
});
