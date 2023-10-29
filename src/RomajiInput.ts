import * as vscode from 'vscode';
import { romKanaBaseRule } from './RomKanaRule';
import { insertOrReplaceSelection } from './extension';

export class RomajiInput {
    private romBuffer: string[] = [];

    private static romToHiragana(str: string): string[] | undefined {
        if (romKanaBaseRule[str]) {
            return [romKanaBaseRule[str].hiragana, romKanaBaseRule[str].remain];
        }
    }

    public processInput(key: string): void {
        this.romBuffer.push(key);
        let romBufferStr = this.romBuffer.join('');
        let kana = RomajiInput.romToHiragana(romBufferStr);
        if (kana) {
            insertOrReplaceSelection(kana[0]);
            this.romBuffer = [kana[1]];
        }
        // show romBuffer content in a line annotation
        vscode.window.showInformationMessage("skk-vscode: " + this.romBuffer.join(''));
    }

    public reset(): void {
        this.romBuffer = [];
    }

    public isEmpty(): boolean {
        return this.romBuffer.length === 0;
    }

    public deleteLastChar(): void {
        this.romBuffer.pop();
    }
}
