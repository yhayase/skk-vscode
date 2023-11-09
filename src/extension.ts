// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { RomajiInput } from './RomajiInput';

enum InputMode {
	hiragana,
	katakana,
	zekakuEisu,
	ascii
}

enum HenkanMode {
	kakutei, // (■モード)
	midashigo, // ▽モード
	henkan // ▼モード
}

enum MidashigoMode {
	start, // ▽あい
	okurigana // ▽あい*s
}


var timestampOfCursorMoveCausedByKeyInput : number|undefined = undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// vscode.window.showInformationMessage("skk-vscode: start");

	let midashigoStart: vscode.Position | undefined = undefined; // vscode.window.activeTextEditor?.selection.start;

	let inputMode = InputMode.ascii;
	let henkanMode = HenkanMode.kakutei;
	let midashigoMode = MidashigoMode.start;

    var romajiInput = new RomajiInput();

    let previousTextEditor = vscode.window.activeTextEditor;
    let previousSelections = vscode.window.activeTextEditor?.selections;
    function updatePreviousEditorAndSelections() {
        previousTextEditor = vscode.window.activeTextEditor;
        previousSelections = vscode.window.activeTextEditor?.selections;
    }

	function doHenkan(okuri: string|undefined = undefined) {
		const editor = vscode.window.activeTextEditor;
		if (midashigoStart === undefined) {
			vscode.window.showInformationMessage('変換開始位置が不明です');
			henkanMode = HenkanMode.kakutei;
			romajiInput.reset();
			return;
		}

		if (editor === undefined) {
			return;
		}
		// check if content of the editor is longer than midashigoStart
		if (editor.document.getText().length < midashigoStart.character) {
			vscode.window.showInformationMessage('変換開始位置が不正です');
			henkanMode = HenkanMode.kakutei;
			romajiInput.reset();
			return;
		}
			
		if (!midashigoStart?.isBefore(editor.selection.start)) {
			vscode.window.showInformationMessage('変換開始位置よりも前にカーソルがあります');
			return;
		}

		const midashigoRange = new vscode.Range(midashigoStart, editor.selection.end);
		let midashigo = editor.document.getText(midashigoRange);

		if (midashigo[0] !== '▽') {
			// In case of the begginning ▽ is deleted by the user or other causes
			
			vscode.window.showInformationMessage('It seems that you have deleted ▽');

			// clear midashigoStart
			henkanMode = HenkanMode.kakutei;

			return;
		}

		if (okuri) {
			const sagyo = ["さ", "し", "す", "せ", "そ"];
			if (midashigo === "▽か" && sagyo.includes(okuri[0])) {
				let candidates : string[] = ["課", "貸"];
				
				vscode.window.showQuickPick(
					candidates.map((value) => value + okuri)
					).then((value) => {
					if (value) {
						replaceRange(midashigoRange, value);
						henkanMode = HenkanMode.kakutei;
					}
				});
			} else {
				vscode.window.showInformationMessage('変換できません');
				henkanMode = HenkanMode.kakutei;
				romajiInput.reset();
			}
		} else {
			if (midashigo === '▽かんじ') {
				let candidates = ["漢字", "幹事"];
				
				vscode.window.showQuickPick(candidates).then((value) => {
					if (value) {
						replaceRange(midashigoRange, value);
						henkanMode = HenkanMode.kakutei;
					}
				});
			} else {
				vscode.window.showInformationMessage('変換できません');
				henkanMode = HenkanMode.kakutei;
				romajiInput.reset();
			}
		}
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let lowerAlphaInput = vscode.commands.registerCommand('skk-vscode.lowerAlphabetInput', (key: string) => {
		switch (inputMode) {
			case InputMode.ascii:
				insertOrReplaceSelection(key);
				break;
			case InputMode.hiragana:
				switch (henkanMode) {
					case HenkanMode.midashigo:
						if (midashigoMode === MidashigoMode.okurigana) {
							let okuri = romajiInput.processInput(key.toLowerCase());
							if (okuri.length === 0) {
								break;
							}
							
							doHenkan(okuri);
							break;
						}
						// fall through
					case HenkanMode.kakutei:
						if (key === 'l') {
							inputMode = InputMode.ascii;
							vscode.window.showInformationMessage('skk-vscode: ascii mode');
							break;
						}
						
						let rval = romajiInput.processInput(key);
						if (rval) {
							insertOrReplaceSelection(rval);
						}
						break;
					default:
						break;
				}
				break;

			case InputMode.katakana:
				// fall through
			case InputMode.zekakuEisu:
				// fall through
			default:
				inputMode = InputMode.ascii;
				break;
		}
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(lowerAlphaInput);


	let upperAlphaInput = vscode.commands.registerCommand('skk-vscode.upperAlphabetInput', (key: string) => {
		switch (inputMode) {
			case InputMode.ascii:
				insertOrReplaceSelection(key);
				break;
			case InputMode.hiragana:
				switch (henkanMode) {
					case HenkanMode.midashigo:
						midashigoMode = MidashigoMode.okurigana;
		
						let okuri = romajiInput.processInput(key.toLowerCase());
						if (okuri.length === 0) {
							break;
						}
						
						doHenkan(okuri);
						break;
					case HenkanMode.kakutei:
						midashigoStart = vscode.window.activeTextEditor?.selection.start;
						insertOrReplaceSelection('▽');
						henkanMode = HenkanMode.midashigo;
						midashigoMode = MidashigoMode.start;
						// fall through
					default:
						romajiInput.processInput(key.toLowerCase());
						break;
				}
				break;
			case InputMode.katakana:
				// fall through
			case InputMode.zekakuEisu:
				// fall through
			default:
				inputMode = InputMode.ascii;
				break;
		}
        updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(upperAlphaInput);

	let spaceInput = vscode.commands.registerCommand('skk-vscode.spaceInput', () => {
        switch (inputMode) {
			case InputMode.ascii:
				insertOrReplaceSelection(' ');
				break;
			case InputMode.hiragana:
				switch (henkanMode) {
					case HenkanMode.kakutei:
						insertOrReplaceSelection(' ');
						break;
					case HenkanMode.midashigo:
						doHenkan();
						break;
				}
				break;
			case InputMode.katakana:
				// fall through
			case InputMode.zekakuEisu:
				// fall through
			default:
				inputMode = InputMode.ascii;
				break;
		}
		updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(spaceInput);

	let ctrlJInput = vscode.commands.registerCommand('skk-vscode.ctrlJInput', () => {
		switch (inputMode) {
			case InputMode.ascii:
				inputMode = InputMode.hiragana;
				vscode.window.showInformationMessage('skk-vscode: hiragana mode');
				break;
			case InputMode.hiragana:
				switch (henkanMode) {
					default:
						henkanMode = HenkanMode.kakutei;
						romajiInput.reset();
				}
				break;
			case InputMode.katakana:
				// fall through
			case InputMode.zekakuEisu:
				// fall through
			default:
				inputMode = InputMode.ascii;
				break;
		}
        updatePreviousEditorAndSelections();
	});
	context.subscriptions.push(ctrlJInput);

    let backspaceInput = vscode.commands.registerCommand('skk-vscode.backspaceInput', () => {
		switch (inputMode) {
			case InputMode.katakana:
				// fall through
			case InputMode.zekakuEisu:
				// fall through
			default:
				// fall through	
			case InputMode.ascii: {
				// delete backward char in the editor
				const editor = vscode.window.activeTextEditor;
				if (editor) {
					vscode.commands.executeCommand('deleteLeft');
				}
				break;
			}
			case InputMode.hiragana:
				switch (henkanMode) {
					case HenkanMode.midashigo:
						if (! romajiInput.isEmpty()) {
							romajiInput.deleteLastChar();
							break;
						}
					default:
						// delete backward char in the editor
						const editor = vscode.window.activeTextEditor;
						if (editor) {
							vscode.commands.executeCommand('deleteLeft');
						}
				}
				break;
			}
        updatePreviousEditorAndSelections();
    });
    context.subscriptions.push(backspaceInput);

    let numberInput = vscode.commands.registerCommand('skk-vscode.numberInput', (key: string) => {
		switch (inputMode) {
			case InputMode.ascii:
				insertOrReplaceSelection(key);
				break;
			case InputMode.hiragana:
				switch (henkanMode) {
					case HenkanMode.midashigo:
						romajiInput.processInput(key);
						break;
					default:
						insertOrReplaceSelection(key);
						break;
				}
				break;
			case InputMode.katakana:
				// fall through
			case InputMode.zekakuEisu:
				// fall through
			default:
				inputMode = InputMode.ascii;
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


