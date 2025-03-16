import { setInputMode } from "../extension";
import * as vscode from 'vscode';
import { IInputMode } from "./IInputMode";
import { HiraganaMode } from "./HiraganaMode";
import { IEditor } from "../editor/IEditor";
import { VSCodeEditor } from "../editor/VSCodeEditor";

export class AsciiMode implements IInputMode {
    // AsciiMode is stateless, so the singleton can be stored in a static field.
    private static instance: AsciiMode = new AsciiMode();
    private editor: IEditor = new VSCodeEditor();
    public static getInstance(): AsciiMode {
        return AsciiMode.instance;
    }

    public reset(): void {
        // Do nothing
    }

    public lowerAlphabetInput(key: string): void {
        this.editor.insertOrReplaceSelection(key);
    }

    public upperAlphabetInput(key: string): void {
        this.editor.insertOrReplaceSelection(key);
    }

    public spaceInput(): void {
        this.editor.insertOrReplaceSelection(" ");
    }

    public ctrlJInput(): void {
        setInputMode(HiraganaMode.getInstance());
    }

    public ctrlGInput(): void {
        // Do nothing
    }

    public enterInput(): void {
        this.editor.insertOrReplaceSelection("\n");
    }

    public backspaceInput(): void {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            vscode.commands.executeCommand('deleteLeft');
        }
    }

    public numberInput(key: string): void {
        this.editor.insertOrReplaceSelection(key);
    }

    public symbolInput(key: string): void {
        this.editor.insertOrReplaceSelection(key);
    }
}