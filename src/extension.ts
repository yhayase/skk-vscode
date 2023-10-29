// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

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

class RomajiInput {
	private romBuffer : string[] = [];

	public processInput(key: string) : void {
		this.romBuffer.push(key);
		let romBufferStr = this.romBuffer.join('');
		let kana = romToHiragana(romBufferStr);
		if (kana) {
			insertOrReplaceSelection(kana[0]);
			this.romBuffer = [kana[1]];
		}
		// show romBuffer content in a line annotation

		vscode.window.showInformationMessage("skk-vscode: " + this.romBuffer.join(''));
	}

    public reset() : void {
        this.romBuffer = [];
    }

    public isEmpty() : boolean {
        return this.romBuffer.length === 0; 
    }

    public deleteLastChar() : void {
        this.romBuffer.pop();
    }
}

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

function insertOrReplaceSelection(str: string) {
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

interface RomKanaRule {
	remain: string;
	hiragana: string;
	katakana?: string;
}

let romKanaBaseRule: {[key: string]: RomKanaRule} = {
    "a": {"remain": "", "katakana": "ア", "hiragana": "あ"},
    "bb": {"remain": "b", "katakana": "ッ", "hiragana": "っ"},
    "ba": {"remain": "", "katakana": "バ", "hiragana": "ば"},
    "be": {"remain": "", "katakana": "ベ", "hiragana": "べ"},
    "bi": {"remain": "", "katakana": "ビ", "hiragana": "び"},
    "bo": {"remain": "", "katakana": "ボ", "hiragana": "ぼ"},
    "bu": {"remain": "", "katakana": "ブ", "hiragana": "ぶ"},
    "bya": {"remain": "", "katakana": "ビャ", "hiragana": "びゃ"},
    "bye": {"remain": "", "katakana": "ビェ", "hiragana": "びぇ"},
    "byi": {"remain": "", "katakana": "ビィ", "hiragana": "びぃ"},
    "byo": {"remain": "", "katakana": "ビョ", "hiragana": "びょ"},
    "byu": {"remain": "", "katakana": "ビュ", "hiragana": "びゅ"},
    "cc": {"remain": "c", "katakana": "ッ", "hiragana": "っ"},
    "cha": {"remain": "", "katakana": "チャ", "hiragana": "ちゃ"},
    "che": {"remain": "", "katakana": "チェ", "hiragana": "ちぇ"},
    "chi": {"remain": "", "katakana": "チ", "hiragana": "ち"},
    "cho": {"remain": "", "katakana": "チョ", "hiragana": "ちょ"},
    "chu": {"remain": "", "katakana": "チュ", "hiragana": "ちゅ"},
    "cya": {"remain": "", "katakana": "チャ", "hiragana": "ちゃ"},
    "cye": {"remain": "", "katakana": "チェ", "hiragana": "ちぇ"},
    "cyi": {"remain": "", "katakana": "チィ", "hiragana": "ちぃ"},
    "cyo": {"remain": "", "katakana": "チョ", "hiragana": "ちょ"},
    "cyu": {"remain": "", "katakana": "チュ", "hiragana": "ちゅ"},
    "dd": {"remain": "d", "katakana": "ッ", "hiragana": "っ"},
    "da": {"remain": "", "katakana": "ダ", "hiragana": "だ"},
    "de": {"remain": "", "katakana": "デ", "hiragana": "で"},
    "dha": {"remain": "", "katakana": "デャ", "hiragana": "でゃ"},
    "dhe": {"remain": "", "katakana": "デェ", "hiragana": "でぇ"},
    "dhi": {"remain": "", "katakana": "ディ", "hiragana": "でぃ"},
    "dho": {"remain": "", "katakana": "デョ", "hiragana": "でょ"},
    "dhu": {"remain": "", "katakana": "デュ", "hiragana": "でゅ"},
    "di": {"remain": "", "katakana": "ヂ", "hiragana": "ぢ"},
    "do": {"remain": "", "katakana": "ド", "hiragana": "ど"},
    "du": {"remain": "", "katakana": "ヅ", "hiragana": "づ"},
    "dya": {"remain": "", "katakana": "ヂャ", "hiragana": "ぢゃ"},
    "dye": {"remain": "", "katakana": "ヂェ", "hiragana": "ぢぇ"},
    "dyi": {"remain": "", "katakana": "ヂィ", "hiragana": "ぢぃ"},
    "dyo": {"remain": "", "katakana": "ヂョ", "hiragana": "ぢょ"},
    "dyu": {"remain": "", "katakana": "ヂュ", "hiragana": "ぢゅ"},
    "e": {"remain": "", "katakana": "エ", "hiragana": "え"},
    "ff": {"remain": "f", "katakana": "ッ", "hiragana": "っ"},
    "fa": {"remain": "", "katakana": "ファ", "hiragana": "ふぁ"},
    "fe": {"remain": "", "katakana": "フェ", "hiragana": "ふぇ"},
    "fi": {"remain": "", "katakana": "フィ", "hiragana": "ふぃ"},
    "fo": {"remain": "", "katakana": "フォ", "hiragana": "ふぉ"},
    "fu": {"remain": "", "katakana": "フ", "hiragana": "ふ"},
    "fya": {"remain": "", "katakana": "フャ", "hiragana": "ふゃ"},
    "fye": {"remain": "", "katakana": "フェ", "hiragana": "ふぇ"},
    "fyi": {"remain": "", "katakana": "フィ", "hiragana": "ふぃ"},
    "fyo": {"remain": "", "katakana": "フョ", "hiragana": "ふょ"},
    "fyu": {"remain": "", "katakana": "フュ", "hiragana": "ふゅ"},
    "gg": {"remain": "g", "katakana": "ッ", "hiragana": "っ"},
    "ga": {"remain": "", "katakana": "ガ", "hiragana": "が"},
    "ge": {"remain": "", "katakana": "ゲ", "hiragana": "げ"},
    "gi": {"remain": "", "katakana": "ギ", "hiragana": "ぎ"},
    "go": {"remain": "", "katakana": "ゴ", "hiragana": "ご"},
    "gu": {"remain": "", "katakana": "グ", "hiragana": "ぐ"},
    "gya": {"remain": "", "katakana": "ギャ", "hiragana": "ぎゃ"},
    "gye": {"remain": "", "katakana": "ギェ", "hiragana": "ぎぇ"},
    "gyi": {"remain": "", "katakana": "ギィ", "hiragana": "ぎぃ"},
    "gyo": {"remain": "", "katakana": "ギョ", "hiragana": "ぎょ"},
    "gyu": {"remain": "", "katakana": "ギュ", "hiragana": "ぎゅ"},
    "ha": {"remain": "", "katakana": "ハ", "hiragana": "は"},
    "he": {"remain": "", "katakana": "ヘ", "hiragana": "へ"},
    "hi": {"remain": "", "katakana": "ヒ", "hiragana": "ひ"},
    "ho": {"remain": "", "katakana": "ホ", "hiragana": "ほ"},
    "hu": {"remain": "", "katakana": "フ", "hiragana": "ふ"},
    "hya": {"remain": "", "katakana": "ヒャ", "hiragana": "ひゃ"},
    "hye": {"remain": "", "katakana": "ヒェ", "hiragana": "ひぇ"},
    "hyi": {"remain": "", "katakana": "ヒィ", "hiragana": "ひぃ"},
    "hyo": {"remain": "", "katakana": "ヒョ", "hiragana": "ひょ"},
    "hyu": {"remain": "", "katakana": "ヒュ", "hiragana": "ひゅ"},
    "i": {"remain": "", "katakana": "イ", "hiragana": "い"},
    "jj": {"remain": "j", "katakana": "ッ", "hiragana": "っ"},
    "ja": {"remain": "", "katakana": "ジャ", "hiragana": "じゃ"},
    "je": {"remain": "", "katakana": "ジェ", "hiragana": "じぇ"},
    "ji": {"remain": "", "katakana": "ジ", "hiragana": "じ"},
    "jo": {"remain": "", "katakana": "ジョ", "hiragana": "じょ"},
    "ju": {"remain": "", "katakana": "ジュ", "hiragana": "じゅ"},
    "jya": {"remain": "", "katakana": "ジャ", "hiragana": "じゃ"},
    "jye": {"remain": "", "katakana": "ジェ", "hiragana": "じぇ"},
    "jyi": {"remain": "", "katakana": "ジィ", "hiragana": "じぃ"},
    "jyo": {"remain": "", "katakana": "ジョ", "hiragana": "じょ"},
    "jyu": {"remain": "", "katakana": "ジュ", "hiragana": "じゅ"},
    "kk": {"remain": "k", "katakana": "ッ", "hiragana": "っ"},
    "ka": {"remain": "", "katakana": "カ", "hiragana": "か"},
    "ke": {"remain": "", "katakana": "ケ", "hiragana": "け"},
    "ki": {"remain": "", "katakana": "キ", "hiragana": "き"},
    "ko": {"remain": "", "katakana": "コ", "hiragana": "こ"},
    "ku": {"remain": "", "katakana": "ク", "hiragana": "く"},
    "kya": {"remain": "", "katakana": "キャ", "hiragana": "きゃ"},
    "kye": {"remain": "", "katakana": "キェ", "hiragana": "きぇ"},
    "kyi": {"remain": "", "katakana": "キィ", "hiragana": "きぃ"},
    "kyo": {"remain": "", "katakana": "キョ", "hiragana": "きょ"},
    "kyu": {"remain": "", "katakana": "キュ", "hiragana": "きゅ"},
    "ma": {"remain": "", "katakana": "マ", "hiragana": "ま"},
    "me": {"remain": "", "katakana": "メ", "hiragana": "め"},
    "mi": {"remain": "", "katakana": "ミ", "hiragana": "み"},
    "mo": {"remain": "", "katakana": "モ", "hiragana": "も"},
    "mu": {"remain": "", "katakana": "ム", "hiragana": "む"},
    "mya": {"remain": "", "katakana": "ミャ", "hiragana": "みゃ"},
    "mye": {"remain": "", "katakana": "ミェ", "hiragana": "みぇ"},
    "myi": {"remain": "", "katakana": "ミィ", "hiragana": "みぃ"},
    "myo": {"remain": "", "katakana": "ミョ", "hiragana": "みょ"},
    "myu": {"remain": "", "katakana": "ミュ", "hiragana": "みゅ"},
    "n": {"remain": "", "katakana": "ン", "hiragana": "ん"},
    "n'": {"remain": "", "katakana": "ン", "hiragana": "ん"},
    "na": {"remain": "", "katakana": "ナ", "hiragana": "な"},
    "ne": {"remain": "", "katakana": "ネ", "hiragana": "ね"},
    "ni": {"remain": "", "katakana": "ニ", "hiragana": "に"},
    "nn": {"remain": "", "katakana": "ン", "hiragana": "ん"},
    "no": {"remain": "", "katakana": "ノ", "hiragana": "の"},
    "nu": {"remain": "", "katakana": "ヌ", "hiragana": "ぬ"},
    "nya": {"remain": "", "katakana": "ニャ", "hiragana": "にゃ"},
    "nye": {"remain": "", "katakana": "ニェ", "hiragana": "にぇ"},
    "nyi": {"remain": "", "katakana": "ニィ", "hiragana": "にぃ"},
    "nyo": {"remain": "", "katakana": "ニョ", "hiragana": "にょ"},
    "nyu": {"remain": "", "katakana": "ニュ", "hiragana": "にゅ"},
    "o": {"remain": "", "katakana": "オ", "hiragana": "お"},
    "pp": {"remain": "p", "katakana": "ッ", "hiragana": "っ"},
    "pa": {"remain": "", "katakana": "パ", "hiragana": "ぱ"},
    "pe": {"remain": "", "katakana": "ペ", "hiragana": "ぺ"},
    "pi": {"remain": "", "katakana": "ピ", "hiragana": "ぴ"},
    "po": {"remain": "", "katakana": "ポ", "hiragana": "ぽ"},
    "pu": {"remain": "", "katakana": "プ", "hiragana": "ぷ"},
    "pya": {"remain": "", "katakana": "ピャ", "hiragana": "ぴゃ"},
    "pye": {"remain": "", "katakana": "ピェ", "hiragana": "ぴぇ"},
    "pyi": {"remain": "", "katakana": "ピィ", "hiragana": "ぴぃ"},
    "pyo": {"remain": "", "katakana": "ピョ", "hiragana": "ぴょ"},
    "pyu": {"remain": "", "katakana": "ピュ", "hiragana": "ぴゅ"},
    "rr": {"remain": "r", "katakana": "ッ", "hiragana": "っ"},
    "ra": {"remain": "", "katakana": "ラ", "hiragana": "ら"},
    "re": {"remain": "", "katakana": "レ", "hiragana": "れ"},
    "ri": {"remain": "", "katakana": "リ", "hiragana": "り"},
    "ro": {"remain": "", "katakana": "ロ", "hiragana": "ろ"},
    "ru": {"remain": "", "katakana": "ル", "hiragana": "る"},
    "rya": {"remain": "", "katakana": "リャ", "hiragana": "りゃ"},
    "rye": {"remain": "", "katakana": "リェ", "hiragana": "りぇ"},
    "ryi": {"remain": "", "katakana": "リィ", "hiragana": "りぃ"},
    "ryo": {"remain": "", "katakana": "リョ", "hiragana": "りょ"},
    "ryu": {"remain": "", "katakana": "リュ", "hiragana": "りゅ"},
    "ss": {"remain": "s", "katakana": "ッ", "hiragana": "っ"},
    "sa": {"remain": "", "katakana": "サ", "hiragana": "さ"},
    "se": {"remain": "", "katakana": "セ", "hiragana": "せ"},
    "sha": {"remain": "", "katakana": "シャ", "hiragana": "しゃ"},
    "she": {"remain": "", "katakana": "シェ", "hiragana": "しぇ"},
    "shi": {"remain": "", "katakana": "シ", "hiragana": "し"},
    "sho": {"remain": "", "katakana": "ショ", "hiragana": "しょ"},
    "shu": {"remain": "", "katakana": "シュ", "hiragana": "しゅ"},
    "si": {"remain": "", "katakana": "シ", "hiragana": "し"},
    "so": {"remain": "", "katakana": "ソ", "hiragana": "そ"},
    "su": {"remain": "", "katakana": "ス", "hiragana": "す"},
    "sya": {"remain": "", "katakana": "シャ", "hiragana": "しゃ"},
    "sye": {"remain": "", "katakana": "シェ", "hiragana": "しぇ"},
    "syi": {"remain": "", "katakana": "シィ", "hiragana": "しぃ"},
    "syo": {"remain": "", "katakana": "ショ", "hiragana": "しょ"},
    "syu": {"remain": "", "katakana": "シュ", "hiragana": "しゅ"},
    "tt": {"remain": "t", "katakana": "ッ", "hiragana": "っ"},
    "ta": {"remain": "", "katakana": "タ", "hiragana": "た"},
    "te": {"remain": "", "katakana": "テ", "hiragana": "て"},
    "tha": {"remain": "", "katakana": "テァ", "hiragana": "てぁ"},
    "the": {"remain": "", "katakana": "テェ", "hiragana": "てぇ"},
    "thi": {"remain": "", "katakana": "ティ", "hiragana": "てぃ"},
    "tho": {"remain": "", "katakana": "テョ", "hiragana": "てょ"},
    "thu": {"remain": "", "katakana": "テュ", "hiragana": "てゅ"},
    "ti": {"remain": "", "katakana": "チ", "hiragana": "ち"},
    "to": {"remain": "", "katakana": "ト", "hiragana": "と"},
    "tsu": {"remain": "", "katakana": "ツ", "hiragana": "つ"},
    "tu": {"remain": "", "katakana": "ツ", "hiragana": "つ"},
    "tya": {"remain": "", "katakana": "チャ", "hiragana": "ちゃ"},
    "tye": {"remain": "", "katakana": "チェ", "hiragana": "ちぇ"},
    "tyi": {"remain": "", "katakana": "チィ", "hiragana": "ちぃ"},
    "tyo": {"remain": "", "katakana": "チョ", "hiragana": "ちょ"},
    "tyu": {"remain": "", "katakana": "チュ", "hiragana": "ちゅ"},
    "u": {"remain": "", "katakana": "ウ", "hiragana": "う"},
    "vv": {"remain": "v", "katakana": "ッ", "hiragana": "っ"},
    "va": {"remain": "", "katakana": "ヴァ", "hiragana": "う゛ぁ"},
    "ve": {"remain": "", "katakana": "ヴェ", "hiragana": "う゛ぇ"},
    "vi": {"remain": "", "katakana": "ヴィ", "hiragana": "う゛ぃ"},
    "vo": {"remain": "", "katakana": "ヴォ", "hiragana": "う゛ぉ"},
    "vu": {"remain": "", "katakana": "ヴ", "hiragana": "う゛"},
    "ww": {"remain": "w", "katakana": "ッ", "hiragana": "っ"},
    "wa": {"remain": "", "katakana": "ワ", "hiragana": "わ"},
    "we": {"remain": "", "katakana": "ウェ", "hiragana": "うぇ"},
    "wi": {"remain": "", "katakana": "ウィ", "hiragana": "うぃ"},
    "wo": {"remain": "", "katakana": "ヲ", "hiragana": "を"},
    "wu": {"remain": "", "katakana": "ウ", "hiragana": "う"},
    "xx": {"remain": "x", "katakana": "ッ", "hiragana": "っ"},
    "xa": {"remain": "", "katakana": "ァ", "hiragana": "ぁ"},
    "xe": {"remain": "", "katakana": "ェ", "hiragana": "ぇ"},
    "xi": {"remain": "", "katakana": "ィ", "hiragana": "ぃ"},
    "xka": {"remain": "", "katakana": "ヵ", "hiragana": "か"},
    "xke": {"remain": "", "katakana": "ヶ", "hiragana": "け"},
    "xo": {"remain": "", "katakana": "ォ", "hiragana": "ぉ"},
    "xtsu": {"remain": "", "katakana": "ッ", "hiragana": "っ"},
    "xtu": {"remain": "", "katakana": "ッ", "hiragana": "っ"},
    "xu": {"remain": "", "katakana": "ゥ", "hiragana": "ぅ"},
    "xwa": {"remain": "", "katakana": "ヮ", "hiragana": "ゎ"},
    "xwe": {"remain": "", "katakana": "ヱ", "hiragana": "ゑ"},
    "xwi": {"remain": "", "katakana": "ヰ", "hiragana": "ゐ"},
    "xya": {"remain": "", "katakana": "ャ", "hiragana": "ゃ"},
    "xyo": {"remain": "", "katakana": "ョ", "hiragana": "ょ"},
    "xyu": {"remain": "", "katakana": "ュ", "hiragana": "ゅ"},
    "yy": {"remain": "y", "katakana": "ッ", "hiragana": "っ"},
    "ya": {"remain": "", "katakana": "ヤ", "hiragana": "や"},
    "ye": {"remain": "", "katakana": "イェ", "hiragana": "いぇ"},
    "yo": {"remain": "", "katakana": "ヨ", "hiragana": "よ"},
    "yu": {"remain": "", "katakana": "ユ", "hiragana": "ゆ"},
    "zz": {"remain": "z", "katakana": "ッ", "hiragana": "っ"},
    "z ": {"remain": "", "hiragana": "　"},
    "z*": {"remain": "", "hiragana": "※"},
    "z,": {"remain": "", "hiragana": "‥"},
    "z-": {"remain": "", "hiragana": "〜"},
    "z.": {"remain": "", "hiragana": "…"},
    "z/": {"remain": "", "hiragana": "・"},
    "z0": {"remain": "", "hiragana": "○"},
    "z:": {"remain": "", "hiragana": "゜"},
    "z;": {"remain": "", "hiragana": "゛"},
    "z@": {"remain": "", "hiragana": "◎"},
    "z[": {"remain": "", "hiragana": "『"},
    "z]": {"remain": "", "hiragana": "』"},
    "z{": {"remain": "", "hiragana": "【"},
    "z}": {"remain": "", "hiragana": "】"},
    "z(": {"remain": "", "hiragana": "（"},
    "z)": {"remain": "", "hiragana": "）"},
    "za": {"remain": "", "katakana": "ザ", "hiragana": "ざ"},
    "ze": {"remain": "", "katakana": "ゼ", "hiragana": "ぜ"},
    "zh": {"remain": "", "hiragana": "←"},
    "zi": {"remain": "", "katakana": "ジ", "hiragana": "じ"},
    "zj": {"remain": "", "hiragana": "↓"},
    "zk": {"remain": "", "hiragana": "↑"},
    "zl": {"remain": "", "hiragana": "→"},
    "zL": {"remain": "", "hiragana": "⇒"},
    "zn": {"remain": "", "hiragana": "ー"},
    "zo": {"remain": "", "katakana": "ゾ", "hiragana": "ぞ"},
    "zu": {"remain": "", "katakana": "ズ", "hiragana": "ず"},
    "zya": {"remain": "", "katakana": "ジャ", "hiragana": "じゃ"},
    "zye": {"remain": "", "katakana": "ジェ", "hiragana": "じぇ"},
    "zyi": {"remain": "", "katakana": "ジィ", "hiragana": "じぃ"},
    "zyo": {"remain": "", "katakana": "ジョ", "hiragana": "じょ"},
    "zyu": {"remain": "", "katakana": "ジュ", "hiragana": "じゅ"}
};

function romToHiragana(str: string) : string[] | undefined {
	if (romKanaBaseRule[str]) {
		return [romKanaBaseRule[str].hiragana, romKanaBaseRule[str].remain];
	}
}

