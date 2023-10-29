// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { RomajiInput } from './RomajiInput';

enum InputMode {
	hiragana,
	katakana,
	zekakuEisu,
	direct
}

enum HenkanMode {
	kakutei, // (■モード)
	midashigo, // ▽モード
	henkan // ▼モード
}


var timestampOfCursorMoveCausedByKeyInput : number|undefined = undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// vscode.window.showInformationMessage("skk-vscode: start");

	let midashigoStart: vscode.Position | undefined = undefined; // vscode.window.activeTextEditor?.selection.start;

	let henkanMode = HenkanMode.kakutei;

    var romajiInput = new RomajiInput();

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
		switch (henkanMode) {
			case HenkanMode.kakutei:
			case HenkanMode.midashigo:
				romajiInput.processInput(key);
				break;
			default:
				break;
		}
        updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(lowerAlphaInput);

	let upperAlphaInput = vscode.commands.registerCommand('skk-vscode.upperAlphabetInput', (key: string) => {
		switch (henkanMode) {
			case HenkanMode.kakutei:
				midashigoStart = vscode.window.activeTextEditor?.selection.start;
				insertOrReplaceSelection('▽');
				henkanMode = HenkanMode.midashigo;
                // fall through
			default:
				romajiInput.processInput(key.toLowerCase());
				break;
		}
        updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(upperAlphaInput);

	let spaceInput = vscode.commands.registerCommand('skk-vscode.spaceInput', () => {
        updatePreviousEditorAndSelections();
		switch (henkanMode) {
			case HenkanMode.kakutei:
				insertOrReplaceSelection(' ');
				break;
			case HenkanMode.midashigo:
				henkanMode = HenkanMode.kakutei;
				const editor = vscode.window.activeTextEditor;
				if (editor) {
					if (midashigoStart?.isBefore(editor.selection.start)) {
                        romajiInput.reset();

                        const midashigoRange = new vscode.Range(midashigoStart, editor.selection.end);
						let midashigo = editor.document.getText(midashigoRange);
                        
                        if (midashigo[0] !== '▽') {
                            // In case of the begginning ▽ is deleted by the user or other causes
                            
                            vscode.window.showInformationMessage('It seems that you have deleted ▽');

                            // clear midashigoStart
                            henkanMode = HenkanMode.kakutei;

                            return;
                        }

						if (midashigo === '▽かんじ') {
							let candidates = ["漢字", "幹事"];
							
							vscode.window.showQuickPick(candidates).then((value) => {
								if (value) {
									replaceRange(midashigoRange, value);
								}
							});
						} else {
							insertOrReplaceSelection('変換できません');
						}
					} else {
						vscode.window.showInformationMessage('変換開始位置よりも前にカーソルがあります');
					}
				}
				break;
		}
        updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(spaceInput);

	let ctrlJInput = vscode.commands.registerCommand('skk-vscode.ctrlJInput', () => {
		switch (henkanMode) {
			default:
				henkanMode = HenkanMode.kakutei;
				romajiInput.reset();
				break;
		}
        updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(ctrlJInput);

    let backspaceInput = vscode.commands.registerCommand('skk-vscode.backspaceInput', () => {
        switch (henkanMode) {
            case HenkanMode.midashigo:
                if (! romajiInput.isEmpty()) {
                    romajiInput.deleteLastChar();
                    break;
                }
                // fall through
            default:
                // delete backward char in the editor
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    vscode.commands.executeCommand('deleteLeft');
                }
        }
        updatePreviousEditorAndSelections();
    });
    context.subscriptions.push(backspaceInput);

    let numberInput = vscode.commands.registerCommand('skk-vscode.numberInput', (key: string) => {
        switch (henkanMode) {
            case HenkanMode.midashigo:
                romajiInput.processInput(key);
                break;
            default:
                insertOrReplaceSelection(key);
                break;
        }
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
        // clear romBuffer
        romajiInput.reset();
    });
}

export function insertOrReplaceSelection(str: string) {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		editor.edit(editBuilder => {
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
}

function replaceRange(range: vscode.Range, str: string) {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		editor.edit(editBuilder => {
			editBuilder.replace(range, str);
		});
	}
    timestampOfCursorMoveCausedByKeyInput = Date.now();
}

// This method is called when your extension is deactivated
export function deactivate() { }


