import { insertOrReplaceSelection, setInputMode} from "../extension";
import * as vscode from 'vscode';
import { InputMode } from "./InputMode";
import { HiraganaMode } from "./HiraganaMode";

export class AsciiMode implements InputMode {
    // AsciiMode is stateless, so the singleton can be stored in a static field.
    private static instance: AsciiMode = new AsciiMode();
    public static getInstance(): AsciiMode  {
        return AsciiMode.instance;
    }

    public reset(): void {
        // Do nothing
    }

    public lowerAlphabetInput(key: string): void {
        insertOrReplaceSelection(key);
    }

    public upperAlphabetInput(key: string): void {
        insertOrReplaceSelection(key);
    }

    public spaceInput(): void {
        insertOrReplaceSelection(" ");
    }

    public ctrlJInput(): void {
        setInputMode(HiraganaMode.getInstance());
    }

    public backspaceInput(): void {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            vscode.commands.executeCommand('deleteLeft');
        }
    }

    public numberInput(key: string): void {
        insertOrReplaceSelection(key);
    }
}