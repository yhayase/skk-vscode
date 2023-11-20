import * as vscode from 'vscode';
import { RomajiInput } from '../RomajiInput';
import { insertOrReplaceSelection, replaceRange } from '../extension';
import { setInputMode } from '../extension';
import { InputMode } from './InputMode';
import { AsciiMode } from './AsciiMode';
import { ZeneiMode } from './ZeneiMode';
import { JisyoCandidate, globalJisyo } from '../jisyo';
import * as wanakana from 'wanakana';

enum HenkanMode {
    kakutei, // (■モード)
    midashigo, // ▽モード
    henkan // ▼モード
}

enum MidashigoMode {
    start, // ▽あい
    okurigana // ▽あい*s
}

export abstract class AbstractKanaMode implements InputMode {
    protected henkanMode: HenkanMode = HenkanMode.kakutei;
    protected midashigoMode: MidashigoMode = MidashigoMode.start;
    protected romajiInput: RomajiInput;

    protected abstract nextMode(): InputMode;

    constructor(romajiInput: RomajiInput) {
        this.romajiInput = romajiInput;
    }
    private midashigoStart: vscode.Position | undefined = undefined;

    public reset(): void {
        this.romajiInput.reset();
    }

    private doHenkan(okuri: string | undefined = undefined) {
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

        let candidates = this.doHenkanInternal(convertKatakanaToHiragana(midashigo.slice(1)), okuri);

        if (candidates instanceof Error) {
            vscode.window.showInformationMessage(candidates.message);
            this.henkanMode = HenkanMode.kakutei;
            this.romajiInput.reset();
        } else {
            vscode.window.showQuickPick(
                candidates.map((cand) => ({label: cand.word, description: cand.annotation}))
            ).then((cand) => {
                if (cand) {
                    replaceRange(midashigoRange, cand.label);
                    this.henkanMode = HenkanMode.kakutei;
                    this.romajiInput.reset();
                }
            });
        }
    }

    private doHenkanInternal(midashigo: string, okuri: string | undefined): JisyoCandidate[]|Error {
        if (okuri) {
            const okuriAlpha = calcFirstAlphabetOfOkurigana(okuri);
            const key = midashigo + okuriAlpha;
            const candidates = globalJisyo.get(key);
            if (candidates === undefined) {
                return new Error('変換できません');
            } else {
                return candidates.map((cand) => new JisyoCandidate(cand.word + okuri, cand.annotation));
            }
        } else {
            const candidates = globalJisyo.get(midashigo);
            if (candidates === undefined) {
                return new Error('変換できません');
            } else {
                return candidates;
            }
        }
    }
    

    public lowerAlphabetInput(key: string): void {
        if (key === 'l') {
            setInputMode(AsciiMode.getInstance());
            vscode.window.showInformationMessage('skk-vscode: ascii mode');
            return;
        }

        switch (this.henkanMode) {
            case HenkanMode.midashigo:
                if (key === 'q') {
                    this.toggleCharTypeInMidashigoAndFixateMidashigo();
                    this.henkanMode = HenkanMode.kakutei;
                    this.romajiInput.reset();
                    break;
                }

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
                if (key === 'q') {
                    let nextMode = this.nextMode();
                    setInputMode(nextMode);
                    vscode.window.showInformationMessage('skk-vscode: ' + nextMode.toString());
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
        if (key === 'L') {
            setInputMode(ZeneiMode.getInstance());
            vscode.window.showInformationMessage('skk-vscode: 全英 mode');
            return;
        }

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
            case HenkanMode.midashigo:
                // delete heading ▽ and fix the remaining text
                this.fixateMidashigo();
                // fall through
            default:
                this.henkanMode = HenkanMode.kakutei;
                this.romajiInput.reset();
        }
    }

    private fixateMidashigo() {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.midashigoStart) {
            const midashigoRange = new vscode.Range(this.midashigoStart, editor.selection.end);
            let midashigo = editor.document.getText(midashigoRange);
            if (midashigo[0] === '▽') {
                replaceRange(midashigoRange, midashigo.slice(1));
            } else {
                vscode.window.showInformationMessage('It seems that you have deleted ▽');
            }
        }
    }

    /**
     * Change character type according to the first character of the midashigo
     * and fixate the midashigo.
     * In case of the first character is
     * - hiragana, convert all appearing hiragana to katakana,
     * - katakana, convert all appearing katakana to hiragana,
     * - ascii, convert all appearing ascii to full-width ascii.
     * - full-width ascii, convert all appearing full-width ascii to ascii.
     * @returns void
     */
    private toggleCharTypeInMidashigoAndFixateMidashigo() {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.midashigoStart) {
            const midashigoRange = new vscode.Range(this.midashigoStart, editor.selection.end);
            let midashigo = editor.document.getText(midashigoRange);

            if (midashigo[0] !== '▽') {
                return;
            }
            midashigo = midashigo.slice(1);

            // function retruns parameter without any conversion
            function identity<T>(c: T): T {
                return c;
            }
            
            // function converts ascii to full-width ascii
            function toFullWidth(text: string): string {
                return text.replace(/[\x20-\x7E]/g, function(c) {
                    // space
                    if (c === ' ') {
                        return '　';
                    }

                    // other ascii printable characters
                    return String.fromCharCode(c.charCodeAt(0) + 0xFEE0);
                });
            }
            function toHalfWidth(text: string): string {
                return text.replace(/(\u3000|[\uFF01-\uFF5E])/g, function(c) {
                    // full width space
                    if (c === '　') {
                        return ' ';
                    }
                    // other full width ascii characters
                    return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
                });
            }
            function isPrintableAsciiOrAsciiSpace(c: string): boolean {
                if (c.length !== 1) {
                    return false;
                }
                return ' ' <= c && c <= '~';
            }
            function isFullWidthAscii(c: string): boolean {
                if (c.length !== 1) {
                    return false;
                }
                return '！' <= c && c <= '～';
            }

            let convFunc = identity<string>;
            let converted = midashigo.split('').map((c) => {
                if (convFunc === identity<string>) {
                    if (wanakana.isHiragana(c)) {
                        convFunc = wanakana.toKatakana;
                    } else if (wanakana.isKatakana(c)) {
                        convFunc = wanakana.toHiragana;
                    } else if (isPrintableAsciiOrAsciiSpace(c)) {
                        convFunc = toFullWidth;
                    } else if (isFullWidthAscii(c)) {
                        convFunc = toHalfWidth;
                    }
                }
                return convFunc(c);                    
            }).join('');
            
            replaceRange(midashigoRange, converted);
        }
    }

    public backspaceInput(): void {
        switch (this.henkanMode) {
            case HenkanMode.midashigo:
                if (!this.romajiInput.isEmpty()) {
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

function calcFirstAlphabetOfOkurigana(okurigana: string): string|undefined {
    return kanaToAlphabet.get(okurigana[0]);
}

const kanaToAlphabet = new Map<string, string>([
["あ", "a"],
["い", "i"],
["う", "u"],
["え", "e"],
["お", "o"],
["か", "k"],
["が", "g"],
["き", "k"],
["ぎ", "g"],
["く", "k"],
["ぐ", "g"],
["け", "k"],
["げ", "g"],
["こ", "k"],
["ご", "g"],
["さ", "s"],
["ざ", "z"],
["し", "s"],
["じ", "z"],
["す", "s"],
["ず", "z"],
["せ", "s"],
["ぜ", "z"],
["そ", "s"],
["ぞ", "z"],
["た", "t"],
["だ", "d"],
["ち", "t"],
["ぢ", "d"],
["つ", "t"],
["づ", "d"],
["て", "t"],
["で", "d"],
["と", "t"],
["ど", "d"],
["な", "n"],
["に", "n"],
["ぬ", "n"],
["ね", "n"],
["の", "n"],
["は", "h"],
["ば", "b"],
["ぱ", "p"],
["ひ", "h"],
["び", "b"],
["ぴ", "p"],
["ふ", "h"],
["ぶ", "b"],
["ぷ", "p"],
["へ", "h"],
["べ", "b"],
["ぺ", "p"],
["ほ", "h"],
["ぼ", "b"],
["ぽ", "p"],
["ま", "m"],
["み", "m"],
["む", "m"],
["め", "m"],
["も", "m"],
["や", "y"],
["ゆ", "y"],
["よ", "y"],
["ら", "r"],
["り", "r"],
["る", "r"],
["れ", "r"],
["ろ", "r"],
["わ", "w"],
["ゐ", "w"],
["ゑ", "w"],
["を", "w"],
["ん", "n"],
["ア", "a"],
["イ", "i"],
["ウ", "u"],
["エ", "e"],
["オ", "o"],
["カ", "k"],
["ガ", "g"],
["キ", "k"],
["ギ", "g"],
["ク", "k"],
["グ", "g"],
["ケ", "k"],
["ゲ", "g"],
["コ", "k"],
["ゴ", "g"],
["サ", "s"],
["ザ", "z"],
["シ", "s"],
["ジ", "z"],
["ス", "s"],
["ズ", "z"],
["セ", "s"],
["ゼ", "z"],
["ソ", "s"],
["ゾ", "z"],
["タ", "t"],
["ダ", "d"],
["チ", "t"],
["ヂ", "d"],
["ツ", "t"],
["ヅ", "d"],
["テ", "t"],
["デ", "d"],
["ト", "t"],
["ド", "d"],
["ナ", "n"],
["ニ", "n"],
["ヌ", "n"],
["ネ", "n"],
["ノ", "n"],
["ハ", "h"],
["バ", "b"],
["パ", "p"],
["ヒ", "h"],
["ビ", "b"],
["ピ", "p"],
["フ", "h"],
["ブ", "b"],
["プ", "p"],
["ヘ", "h"],
["ベ", "b"],
["ペ", "p"],
["ホ", "h"],
["ボ", "b"],
["ポ", "p"],
["マ", "m"],
["ミ", "m"],
["ム", "m"],
["メ", "m"],
["モ", "m"],
["ヤ", "y"],
["ユ", "y"],
["ヨ", "y"],
["ラ", "r"],
["リ", "r"],
["ル", "r"],
["レ", "r"],
["ロ", "r"],
["ワ", "w"],
["ヰ", "w"],
["ヱ", "w"],
["ヲ", "w"],
["ン", "n"],
]);

function convertKatakanaToHiragana(src: string): string {
    return src.split('').map((c) => wanakana.isKatakana(c) ? wanakana.toHiragana(c) : c).join('');
}
