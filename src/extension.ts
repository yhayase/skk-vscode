// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { InputMode } from './input-mode/InputMode';
import { AsciiMode } from './input-mode/AsciiMode';


var timestampOfCursorMoveCausedByKeyInput: number | undefined = undefined;

let inputMode: InputMode = AsciiMode.getInstance();

export function setInputMode(mode: InputMode) {
	mode.reset();
	inputMode = mode;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// vscode.window.showInformationMessage("skk-vscode: start");

	let previousTextEditor = vscode.window.activeTextEditor;
	let previousSelections = vscode.window.activeTextEditor?.selections;
	function updatePreviousEditorAndSelections() {
		previousTextEditor = vscode.window.activeTextEditor;
		previousSelections = vscode.window.activeTextEditor?.selections;
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let lowerAlphaInput = vscode.commands.registerCommand('skk-vscode.lowerAlphabetInput', (key: string) => {
		inputMode.lowerAlphabetInput(key);
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(lowerAlphaInput);


	let upperAlphaInput = vscode.commands.registerCommand('skk-vscode.upperAlphabetInput', (key: string) => {
		inputMode.upperAlphabetInput(key);
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(upperAlphaInput);

	let spaceInput = vscode.commands.registerCommand('skk-vscode.spaceInput', () => {
		inputMode.spaceInput();
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(spaceInput);

	let ctrlJInput = vscode.commands.registerCommand('skk-vscode.ctrlJInput', () => {
		inputMode.ctrlJInput();
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(ctrlJInput);

	let enterInput = vscode.commands.registerCommand('skk-vscode.enterInput', () => {
		inputMode.enterInput();
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(enterInput);

	let backspaceInput = vscode.commands.registerCommand('skk-vscode.backspaceInput', () => {
		inputMode.backspaceInput();
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(backspaceInput);

	let numberInput = vscode.commands.registerCommand('skk-vscode.numberInput', (key: string) => {
		inputMode.numberInput(key);
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(numberInput);

	vscode.window.onDidChangeTextEditorSelection(event => {
		// On cursor moves in event.textEditor

		// Ignore cursor moves caused by other key input events
		if (event.textEditor === previousTextEditor) {
			if (timestampOfCursorMoveCausedByKeyInput && timestampOfCursorMoveCausedByKeyInput >= Date.now() - 100) {
				timestampOfCursorMoveCausedByKeyInput = undefined;
				return;
			}
		}

		vscode.window.showInformationMessage("skk-vscode: cursor moves");
		// clear inputMode state
		inputMode.reset();
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


