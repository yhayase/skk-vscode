import * as vscode from 'vscode';
import { RomKanaRule, romKanaBaseRule } from './RomKanaRule';
import { insertOrReplaceSelection } from './extension';

/**
 * Class of Romaji Input State and Conversion
 */
export class RomajiInput {
    private romBuffer: string[] = [];

    /**
     * Convert the given romaji sequence to hiragana and remaining romaji sequence 
     * @param str romaji sequence
     * @returns [hiragana, remaining romaji]
     */
    private static romToHiragana(str: string): [string, string] {
        if (str.length === 0) {
            return ["", str];
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
                return ["", str];
            }
        }
        
        // No exact match found.
        // Try to find the longest prefix
        let kana = "";
        outer: do {
            for (let i = str.length; i > 0; i--) {
                const prefix = str.slice(0, i);
                const ruleForPrefix = romKanaBaseRule[prefix];
                if (ruleForPrefix) {
                    kana += ruleForPrefix.hiragana;
                    str = ruleForPrefix.remain + str.slice(i);
                    continue outer;
                }
            }
        } while (false);
        // All possible prefixes are converted to kanas

        // Check remaining input string is possibly convertible to kana
        while (str.length > 0) {
            const count = RomajiInput.countPrefixOf(romKanaBaseRule, str);
            if (count > 0) {
                console.assert(count > 1);
                // Multiple rules with the same prefix match
                break;
            }

            // retry with the first character removed
            str = str.slice(1);
        }

        // Match found for the prefix, convert the prefix and postpone the rest
        return [kana, str];
    }

    /**
     * Count the number of rules whose key starts with the given string
     * @param romKanaBaseRule Romaji-Kana conversion rule
     * @param str string to be matched
     * @returns number of rules whose key starts with the given string
     */
    static countPrefixOf(romKanaBaseRule: { [key: string]: RomKanaRule }, str: string) : number {
        return Object.keys(romKanaBaseRule).filter(key => key.startsWith(str)).length;
    }

    /**
     * Joins the given input character to the romaji buffer and returns the converted kana if any
     * @param key new input character
     * @returns converted kana if any
     */
    public processInput(key: string): string {
        this.romBuffer.push(key);
        let romBufferStr = this.romBuffer.join('');
        let kana = RomajiInput.romToHiragana(romBufferStr);
        if (kana[0]) {
            // new kana is generated
            this.setRomBuffer(kana[1]); // update romBuffer to remaining romaji
            vscode.window.showInformationMessage("skk-vscode: " + this.romBuffer.join(''));
        }
        return kana[0]; // return the new kana or empty string
    }

    /**
     * Setter for romBuffer
     */
    private setRomBuffer(romaji: string) : void {
        this.romBuffer = romaji.split('');
    }

    /**
     * Initialize the object state
     */
    public reset(): void {
        this.romBuffer = [];
    }

    /**
     * Returns true if the romaji buffer is empty
     */
    public isEmpty(): boolean {
        return this.romBuffer.length === 0;
    }

    /**
     * Delete the last character from the romaji buffer if not empty
     */
    public deleteLastChar(): void {
        this.romBuffer.pop();
    }
}
