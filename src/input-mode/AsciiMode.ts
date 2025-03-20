import { IInputMode } from "./IInputMode";
import { HiraganaMode } from "./HiraganaMode";
import { AbstractInputMode } from "./AbstractInputMode";
import { EditorFactory } from "../editor/EditorFactory";

export class AsciiMode extends AbstractInputMode {
    // AsciiMode is stateless, so the singleton can be stored in a static field.
    private static instance: AsciiMode;

    public static getInstance(): AsciiMode {
       return new AsciiMode();
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
        this.editor.setInputMode(HiraganaMode.getInstance());
    }

    public ctrlGInput(): void {
        // Do nothing
    }

    public enterInput(): void {
        this.editor.insertOrReplaceSelection("\n");
    }

    public backspaceInput(): void {
        this.editor.deleteLeft();
    }

    public numberInput(key: string): void {
        this.editor.insertOrReplaceSelection(key);
    }

    public symbolInput(key: string): void {
        this.editor.insertOrReplaceSelection(key);
    }
}