import { IInputMode } from "./IInputMode";
import { HiraganaMode } from "./HiraganaMode";
import { AbstractInputMode } from "./AbstractInputMode";

export class AsciiMode extends AbstractInputMode {
    // AsciiMode is stateless, so the singleton can be stored in a static field.
    private static instance: AsciiMode;

    public static getInstance(): AsciiMode {
       return new AsciiMode();
    }

    public async reset(): Promise<void> {
        // Do nothing
    }

    public async lowerAlphabetInput(key: string): Promise<void> {
        await this.editor.insertOrReplaceSelection(key);
    }

    public async upperAlphabetInput(key: string): Promise<void> {
        await this.editor.insertOrReplaceSelection(key);
    }

    public async spaceInput(): Promise<void> {
        await this.editor.insertOrReplaceSelection(" ");
    }

    public async ctrlJInput(): Promise<void> {
        this.editor.setInputMode(HiraganaMode.getInstance());
    }

    public async ctrlGInput(): Promise<void> {
        // Do nothing
    }

    public async enterInput(): Promise<void> {
        await this.editor.insertOrReplaceSelection("\n");
    }

    public async backspaceInput(): Promise<void> {
        await this.editor.deleteLeft();
    }

    public async numberInput(key: string): Promise<void> {
        await this.editor.insertOrReplaceSelection(key);
    }

    public async symbolInput(key: string): Promise<void> {
        await this.editor.insertOrReplaceSelection(key);
    }

    public override getActiveKeys(): Set<string> {
        // In AsciiMode, SKK should only explicitly handle ctrl+j for mode switching.
        // Other keys should be passed through to VSCode's default handling or other extensions.
        return new Set<string>(["ctrl+j"]);
    }
}
