// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { IInputMode } from './input-mode/IInputMode';
import { AsciiMode } from './input-mode/AsciiMode';
import * as jisyo from './jisyo/jisyo';
import { registerMidashigo } from './input-mode/henkan/RegistrationEditor';
import * as AsyncLock from 'async-lock';

let timestampOfCursorMoveCausedByKeyInput: number | undefined = undefined;

/**
 * Map to hold input mode corresponding to each text editor.
 * The key is a text editor and the value is an input mode.
 * The value is undefined if no input mode is set to the text editor.
 * 
 * Note that WeakMap is used to avoid memory leak.
 * (TextEditor is a disposable object, so it is not appropriate to use it as a key of a Map.)
 */
const inputModeMap: WeakMap<vscode.TextDocument, IInputMode> = new WeakMap();

/**
 * Mutex to avoid executing multiple commands at the same time.
 */
const commandLock = new AsyncLock();

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
	// Initialize jisyo
	await jisyo.init(context.globalState, context.globalStorageUri);

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
	const nop = vscode.commands.registerCommand('skk.nop', () => {
		// nothing to do
	});
	context.subscriptions.push(nop);

	const lowerAlphaInput = vscode.commands.registerCommand('skk.lowerAlphabetInput', (key: string) => {
		commandLock.acquire('skk', async () => {
			findInputMode().lowerAlphabetInput(key);
			updatePreviousEditorAndSelections();
		});
	});
	context.subscriptions.push(lowerAlphaInput);

	const upperAlphaInput = vscode.commands.registerCommand('skk.upperAlphabetInput', (key: string) => {
		commandLock.acquire('skk', async () => {
			findInputMode().upperAlphabetInput(key);
			updatePreviousEditorAndSelections();
		});
	});
	context.subscriptions.push(upperAlphaInput);

	const spaceInput = vscode.commands.registerCommand('skk.spaceInput', () => {
		commandLock.acquire('skk', async () => {
			findInputMode().spaceInput();
			updatePreviousEditorAndSelections();
		});
	});
	context.subscriptions.push(spaceInput);

	const ctrlJInput = vscode.commands.registerCommand('skk.ctrlJInput', () => {
		commandLock.acquire('skk', async () => {
			findInputMode().ctrlJInput();
			updatePreviousEditorAndSelections();
		});
	});
	context.subscriptions.push(ctrlJInput);

	const ctrlGInput = vscode.commands.registerCommand('skk.ctrlGInput', () => {
		commandLock.acquire('skk', async () => {
			findInputMode().ctrlGInput();
			updatePreviousEditorAndSelections();
		});
	});
	context.subscriptions.push(ctrlGInput);

	const enterInput = vscode.commands.registerCommand('skk.enterInput', () => {
		commandLock.acquire('skk', async () => {
			findInputMode().enterInput();
			updatePreviousEditorAndSelections();
		});
	});
	context.subscriptions.push(enterInput);

	const backspaceInput = vscode.commands.registerCommand('skk.backspaceInput', () => {
		commandLock.acquire('skk', async () => {
			findInputMode().backspaceInput();
			updatePreviousEditorAndSelections();
		});
	});
	context.subscriptions.push(backspaceInput);

	const numberInput = vscode.commands.registerCommand('skk.numberInput', (key: string) => {
		commandLock.acquire('skk', async () => {
			findInputMode().numberInput(key);
			updatePreviousEditorAndSelections();
		});
	});
	context.subscriptions.push(numberInput);

	const symbolInput = vscode.commands.registerCommand('skk.symbolInput', (key: string) => {
		commandLock.acquire('skk', async () => {
			findInputMode().symbolInput(key);
			updatePreviousEditorAndSelections();
		});
	});
	context.subscriptions.push(symbolInput);

	const registerCandidateCommand = vscode.commands.registerCommand('skk.registerMidashigo', async () => {
		commandLock.acquire('skk', async () => {
			await registerMidashigo();
		});
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

		// clear inputMode state
		findInputMode().reset();
	});

	vscode.window.showInformationMessage("SKK: initialization completed");
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


