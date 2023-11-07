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
     * @param inputRomaji romaji sequence
     * @returns [hiragana, remaining romaji]
     */
    private static romToHiragana(inputRomaji: string): [string, string] {
        if (inputRomaji.length === 0) {
            return ["", inputRomaji];
        }

        const rule = romKanaBaseRule[inputRomaji];
        const prefixMatchCount = RomajiInput.countPrefixOf(romKanaBaseRule, inputRomaji);
        if (rule) {
            // Exact match found
            if (prefixMatchCount === 1) {
                // No other rules which start with str
                return [rule.hiragana, rule.remain];
            } else {
                // ..., but multiple rules start with inputRomaji exist. (e.g. inputRomaji === "n")

                // Postpone the conversion
                return ["", inputRomaji];
            }
        } else if (prefixMatchCount >= 1) {
            // Future input may match the rule. (e.g. inputRomaji === "ky")
            // Postpone the conversion
            return ["", inputRomaji];
        }

        // No exact match and no prefix match found.
        // Try to find the longest prefix which matches the rule exactly.
        // (e.g. inputRomaji === "nk", "n" is the longest prefix which matches the rule exactly)
        let kana = "";
        outer: do {
            for (let i = inputRomaji.length; i > 0; i--) {
                const prefix = inputRomaji.slice(0, i);
                const ruleForPrefix = romKanaBaseRule[prefix];
                if (ruleForPrefix) {
                    kana += ruleForPrefix.hiragana;
                    inputRomaji = ruleForPrefix.remain + inputRomaji.slice(i);
                    continue outer;
                }
            }
        } while (false);
        // All possible prefixes are converted to kanas

        // If the inputRomaji never matches the rule and the inputRomaji is longer than 1 character,
        // keep the last character of the inputRomaji for the next input.
        if (inputRomaji.length >= 1) {
            inputRomaji = inputRomaji.slice(-1);
        }
        // Hereinafter, inputRomaji is either empty or a single character.

        // In case no rule starts with the single character, clear the inputRomaji
        if (inputRomaji.length === 1 && this.countPrefixOf(romKanaBaseRule, inputRomaji) === 0) {
            inputRomaji = "";
        }

        // Match found for the prefix, convert the prefix and postpone the rest
        return [kana, inputRomaji];
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
