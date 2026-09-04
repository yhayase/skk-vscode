import { IInputMode } from "./IInputMode";
import { IEditor } from "../editor/IEditor";
import { EditorFactory } from "../editor/EditorFactory";

export abstract class AbstractInputMode implements IInputMode {
    protected editor: IEditor;
    constructor() {
        this.editor = EditorFactory.getInstance().getEditor();
    }
    abstract reset(): void;
    abstract lowerAlphabetInput(key: string): void | Promise<void>;
    abstract upperAlphabetInput(key: string): void | Promise<void>;
    abstract spaceInput(): void | Promise<void>;
    abstract ctrlJInput(): void | Promise<void>;
    abstract ctrlGInput(): void | Promise<void>;
    abstract enterInput(): void | Promise<void>;
    abstract backspaceInput(): void | Promise<void>;
    abstract numberInput(key: string): void | Promise<void>;
    abstract symbolInput(key: string): void | Promise<void>;
    public getActiveKeys(): Set<string> {
        return new Set<string>(); // Default: no keys are active by SKK
    }
    public abstract getContextualName(): string;
}
