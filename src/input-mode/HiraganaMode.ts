import * as vscode from 'vscode';
import { RomajiInput } from '../RomajiInput';
import { insertOrReplaceSelection, replaceRange } from '../extension';
import { setInputMode } from '../extension';
import { InputMode } from './InputMode';
import { AsciiMode } from './AsciiMode';

enum HenkanMode {
	kakutei, // (■モード)
	midashigo, // ▽モード
	henkan // ▼モード
}

enum MidashigoMode {
	start, // ▽あい
	okurigana // ▽あい*s
}

export class HiraganaMode implements InputMode {
    private static instance: HiraganaMode = new HiraganaMode();
    static getInstance(): HiraganaMode {
        return HiraganaMode.instance;
    }

    private henkanMode: HenkanMode = HenkanMode.kakutei;
	private midashigoMode: MidashigoMode = MidashigoMode.start;
    private romajiInput: RomajiInput = new RomajiInput();

    private midashigoStart: vscode.Position | undefined = undefined;

    public reset(): void {
        this.romajiInput.reset();
    }

    private doHenkan(okuri: string|undefined = undefined) {
		const editor = vscode.window.activeTextEditor;
		if (this.midashigoStart === undefined) {
			vscode.window.showInformationMessage('変換開始位置が不明です');
			this.henkanMode = HenkanMode.kakutei;
			this.romajiInput.reset();
			return;
		}

		if (editor === undefined) {
			return;
		}
		// check if content of the editor is longer than midashigoStart
		if (editor.document.getText().length < this.midashigoStart.character) {
			vscode.window.showInformationMessage('変換開始位置が不正です');
			this.henkanMode = HenkanMode.kakutei;
			this.romajiInput.reset();
			return;
		}
			
		if (!this.midashigoStart?.isBefore(editor.selection.start)) {
			vscode.window.showInformationMessage('変換開始位置よりも前にカーソルがあります');
			return;
		}

		const midashigoRange = new vscode.Range(this.midashigoStart, editor.selection.end);
		let midashigo = editor.document.getText(midashigoRange);

		if (midashigo[0] !== '▽') {
			// In case of the begginning ▽ is deleted by the user or other causes
			
			vscode.window.showInformationMessage('It seems that you have deleted ▽');

			// clear midashigoStart
			this.henkanMode = HenkanMode.kakutei;

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
						this.henkanMode = HenkanMode.kakutei;
					}
				});
			} else {
				vscode.window.showInformationMessage('変換できません');
				this.henkanMode = HenkanMode.kakutei;
				this.romajiInput.reset();
			}
		} else {
			if (midashigo === '▽かんじ') {
				let candidates = ["漢字", "幹事"];
				
				vscode.window.showQuickPick(candidates).then((value) => {
					if (value) {
						replaceRange(midashigoRange, value);
						this.henkanMode = HenkanMode.kakutei;
					}
				});
			} else {
				vscode.window.showInformationMessage('変換できません');
				this.henkanMode = HenkanMode.kakutei;
				this.romajiInput.reset();
			}
		}
	}


    public lowerAlphabetInput(key: string): void {
        switch (this.henkanMode) {
            case HenkanMode.midashigo:
                if (this.midashigoMode === MidashigoMode.okurigana) {
                    let okuri = this.romajiInput.processInput(key.toLowerCase());
                    if (okuri.length === 0) {
                        break;
                    }
                    
                    this.doHenkan(okuri);
                    break;
                }
                // fall through
            case HenkanMode.kakutei:
                if (key === 'l') {
                    setInputMode(AsciiMode.getInstance());
                    vscode.window.showInformationMessage('skk-vscode: ascii mode');
                    break;
                }
                
                let rval = this.romajiInput.processInput(key);
                if (rval) {
                    insertOrReplaceSelection(rval);
                }
                break;
            default:
                break;
        }
    }

    public upperAlphabetInput(key: string): void {
        switch (this.henkanMode) {
            case HenkanMode.midashigo:
                this.midashigoMode = MidashigoMode.okurigana;

                let okuri = this.romajiInput.processInput(key.toLowerCase());
                if (okuri.length === 0) {
                    break;
                }
                
                this.doHenkan(okuri);
                break;
            case HenkanMode.kakutei:
                this.midashigoStart = vscode.window.activeTextEditor?.selection.start;
                insertOrReplaceSelection('▽');
                this.henkanMode = HenkanMode.midashigo;
                this.midashigoMode = MidashigoMode.start;
                // fall through
            default:
                this.romajiInput.processInput(key.toLowerCase());
                break;
        }
    }

    public spaceInput(): void {
        switch (this.henkanMode) {
            case HenkanMode.kakutei:
                insertOrReplaceSelection(' ');
                break;
            case HenkanMode.midashigo:
                this.doHenkan();
                break;
        }
    }
    
    public ctrlJInput(): void {
        switch (this.henkanMode) {
            default:
                this.henkanMode = HenkanMode.kakutei;
                this.romajiInput.reset();
        }
    }
    
    public backspaceInput(): void {
        switch (this.henkanMode) {
            case HenkanMode.midashigo:
                if (! this.romajiInput.isEmpty()) {
                    this.romajiInput.deleteLastChar();
                    break;
                }
            default:
                // delete backward char in the editor
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    vscode.commands.executeCommand('deleteLeft');
                }
        }
    }
    
    public numberInput(key: string): void {
        switch (this.henkanMode) {
            case HenkanMode.midashigo:
                this.romajiInput.processInput(key);
                break;
            default:
                insertOrReplaceSelection(key);
                break;
        }
    }
}
