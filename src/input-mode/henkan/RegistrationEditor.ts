
import * as vscode from 'vscode';
import { getGlobalJisyo } from '../../jisyo/jisyo';

export async function openRegistrationEditor(yomi: string): Promise<void> {
    const content = `読み:${yomi}\n単語:`;
    const doc = await vscode.workspace.openTextDocument({ content, language: 'plaintext' });

    await vscode.window.showTextDocument(doc, { preview: false }).then(async (editor) => {
        // move cursor to the end of the document
        vscode.commands.executeCommand('cursorBottom'); // execute asynchrously
    });

    // Then instruct user to run "skk.tourokuCandidate"
}

/**
 * 現在のエディタの内容が下の形式にあてはまっている場合に、その内容をユーザ辞書に登録する。
 * 例: 読みが「あt」で単語が「合」の場合:
 * 読み:あt
 * 単語:合
 * 
 * ユーザ辞書のキー「あt」に対して，値「合」を先頭に追加する。
 * その後，エディタを閉じる。
 */
export async function registerMidashigo(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const document = editor.document;
    const content = document.getText();
    const lines = content.split('\n');

    // フォーマットの確認
    if (lines.length < 2 // 2行以上でなければならない
        || lines[0].slice(0, 3) !== "読み:" // 1行目は「読み:」で始まらなければならない
        || lines[1].slice(0, 3) !== "単語:" // 2行目は「単語:」で始まらなければならない
        || lines.slice(2).some(line => line.trim() !== '') // 3行目以降は空でなければならない
    ) {
        vscode.window.showErrorMessage("SKK: 辞書登録できません。フォーマットが不正です。");
        return;
    }

    const yomi = lines[0].slice(3);
    const word = lines[1].slice(3);

    if (yomi === '') {
        vscode.window.showErrorMessage("SKK: 辞書登録できません。読みが空です。");
        return;
    }
    if (word === '') {
        vscode.window.showErrorMessage("SKK: 辞書登録できません。単語が空です。");
        return;
    }

    const newCandidateList = [{ word, annotation: undefined }, ...getGlobalJisyo().get(yomi) || []];
    // dedup
    const deduped = newCandidateList.filter((candidate, index, self) => self.findIndex(c => c.word === candidate.word) === index);
    getGlobalJisyo().set(yomi, deduped);

    // clear all text in the editor
    await editor.edit(editBuilder => {
        editBuilder.delete(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(document.lineCount, 0)));
    });
    // close the editor
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
}