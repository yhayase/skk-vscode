import * as vscode from 'vscode';
import { RomKanaRule, romKanaBaseRule } from './RomKanaRule';
import { insertOrReplaceSelection } from './extension';

export class RomajiInput {
    private romBuffer: string[] = [];

    private static romToHiragana(str: string): string[] | undefined {
        if (str.length === 0) {
            return undefined;
        }

        const rule = romKanaBaseRule[str];
        if (rule) {
            const count = RomajiInput.countPrefixOf(romKanaBaseRule, str);
            if (count === 1) {
                // Only one rule matches
                return [rule.hiragana, rule.remain];
            } else {
                // Multiple rules with the same prefix match
                
                // Postpone the conversion until the next input
                return undefined;
            }
        }
        
        // No exact match found.
        // Try to find the longest prefix
        for (let i = str.length; i > 0; i--) {
            const prefix = str.slice(0, i);
            const ruleForPrefix = romKanaBaseRule[prefix];
            if (ruleForPrefix) {
                // Match found for the prefix, convert the prefix and postpone the rest
                return [ruleForPrefix.hiragana, ruleForPrefix.remain + str.slice(i)];
            }
        }
        return undefined;
    }

    static countPrefixOf(romKanaBaseRule: { [key: string]: RomKanaRule }, str: string) : number {
        return Object.keys(romKanaBaseRule).filter(key => key.startsWith(str)).length;
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
