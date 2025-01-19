// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { IInputMode } from './input-mode/IInputMode';
import { AsciiMode } from './input-mode/AsciiMode';
import * as jisyo from './jisyo/jisyo';

var timestampOfCursorMoveCausedByKeyInput: number | undefined = undefined;

/**
 * Map to hold input mode corresponding to each text editor.
 * The key is a text editor and the value is an input mode.
 * The value is undefined if no input mode is set to the text editor.
 * 
 * Note that WeakMap is used to avoid memory leak.
 * (TextEditor is a disposable object, so it is not appropriate to use it as a key of a Map.)
 */
let inputModeMap: WeakMap<vscode.TextDocument, IInputMode> = new WeakMap();

/**
 * Set input mode to the current active text editor.
 * @param mode input mode to be set to the current active text editor.
 * @throws Error if no active text editor is found.
 */
export function setInputMode(mode: IInputMode) {
	mode.reset();
	if (!vscode.window.activeTextEditor) {
		throw Error("No active text editor");
	}
	inputModeMap.set(vscode.window.activeTextEditor.document, mode);
}

/**
 * Utility function to find input mode corresponding to the current active text editor.
 * If not input mode is set to the current active text editor, AsciiMode is set to the current active text editor.
  * @returns input mode corresponding to the current active text editor.
  * @throws Error if no active text editor is found.
 */
function findInputMode(): IInputMode {
	if (!vscode.window.activeTextEditor) {
		throw Error("No active text editor");
	}
	let mode = inputModeMap.get(vscode.window.activeTextEditor.document);
	if (mode === undefined) {
		mode = AsciiMode.getInstance();
		inputModeMap.set(vscode.window.activeTextEditor.document, mode);
	}
	return mode;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	jisyo.init(context.globalState);

	// vscode.window.showInformationMessage("SKK: start");

	let previousTextEditor = vscode.window.activeTextEditor;
	let previousSelections = vscode.window.activeTextEditor?.selections;
	function updatePreviousEditorAndSelections() {
		previousTextEditor = vscode.window.activeTextEditor;
		previousSelections = vscode.window.activeTextEditor?.selections;
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const lowerAlphaInput = vscode.commands.registerCommand('skk.lowerAlphabetInput', (key: string) => {
		findInputMode().lowerAlphabetInput(key);
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(lowerAlphaInput);

	const upperAlphaInput = vscode.commands.registerCommand('skk.upperAlphabetInput', (key: string) => {
		findInputMode().upperAlphabetInput(key);
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(upperAlphaInput);

	const spaceInput = vscode.commands.registerCommand('skk.spaceInput', () => {
		findInputMode().spaceInput();
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(spaceInput);

	const ctrlJInput = vscode.commands.registerCommand('skk.ctrlJInput', () => {
		findInputMode().ctrlJInput();
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(ctrlJInput);

	const ctrlGInput = vscode.commands.registerCommand('skk.ctrlGInput', () => {
		findInputMode().ctrlGInput();
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(ctrlGInput);

	const enterInput = vscode.commands.registerCommand('skk.enterInput', () => {
		findInputMode().enterInput();
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(enterInput);

	const backspaceInput = vscode.commands.registerCommand('skk.backspaceInput', () => {
		findInputMode().backspaceInput();
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(backspaceInput);

	const numberInput = vscode.commands.registerCommand('skk.numberInput', (key: string) => {
		findInputMode().numberInput(key);
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(numberInput);

	const symbolInput = vscode.commands.registerCommand('skk.symbolInput', (key: string) => {
		findInputMode().symbolInput(key);
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(symbolInput);

	const registerCandidateCommand = vscode.commands.registerCommand('skk.registerCandidate', async () => {
		/**
		 * 現在のエディタの内容が下の形式にあてはまっている場合に、その内容をユーザ辞書に登録する。
		 * 読みが「あt」で単語が「合」の場合:
		 * 読み:あt
		 * 単語:合
		 * 
		 * ユーザ辞書のキー「あt」に対して，値「合」を先頭に追加する。
		 * その後，エディタを閉じる。
		 */
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		const document = editor.document;
		const content = document.getText();
		const lines = content.split('\n');

		// フォーマットの確認
		if (lines.length < 2 // 2行以上でなければならない
			|| lines.slice(2).some(line => line.trim() !== '') // 3行目以降は空でなければならない
			|| lines[0].slice(0, 3) !== "読み:" // 1行目は「読み:」で始まらなければならない
			|| lines[1].slice(0, 3) !== "単語:" // 2行目は「単語:」で始まらなければならない
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

		const newCandidateList = [{ word, annotation: '' }, ...jisyo.getGlobalJisyo().get(yomi) || []];
		// dedup
		const deduped = newCandidateList.filter((candidate, index, self) => self.findIndex(c => c.word === candidate.word) === index);
		jisyo.getGlobalJisyo().set(yomi, deduped);

		// clear all text in the editor
		await editor.edit(editBuilder => {
			editBuilder.delete(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(document.lineCount, 0)));
		});
		// close the editor
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	});
	context.subscriptions.push(registerCandidateCommand);

	vscode.window.onDidChangeTextEditorSelection(event => {
		// On cursor moves in event.textEditor

		// Ignore cursor moves caused by other key input events
		if (event.textEditor === previousTextEditor) {
			if (timestampOfCursorMoveCausedByKeyInput && timestampOfCursorMoveCausedByKeyInput >= Date.now() - 100) {
				timestampOfCursorMoveCausedByKeyInput = undefined;
				return;
			}
		}

		vscode.window.showInformationMessage("SKK: cursor moves");
		// clear inputMode state
		findInputMode().reset();
	});
}

export function insertOrReplaceSelection(str: string): Thenable<boolean> {
	const editor = vscode.window.activeTextEditor;
	let rval: Thenable<boolean> = Promise.resolve(false);
	if (editor) {
		rval = editor.edit(editBuilder => {
			if (editor.selection.isEmpty) {
				editBuilder.insert(editor.selection.active, str);
				return;
			} else {
				editBuilder.replace(editor.selection, str);
				// clear selection and move cursor to the end of the inserted text
				editor.selection = new vscode.Selection(editor.selection.active, editor.selection.active);
			}
		});
	}
	timestampOfCursorMoveCausedByKeyInput = Date.now();
	return rval;
}

export function replaceRange(range: vscode.Range, str: string): PromiseLike<boolean> {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		return editor.edit(editBuilder => {
			editBuilder.replace(range, str);
		}).then((value) => {
			timestampOfCursorMoveCausedByKeyInput = Date.now();
			return value;
		});
	}
	return Promise.resolve(false);
}

// This method is called when your extension is deactivated
export function deactivate() { }


