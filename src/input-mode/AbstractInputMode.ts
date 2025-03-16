import { IInputMode } from "./IInputMode";
import { IEditor } from "../editor/IEditor";
import { EditorFactory } from "../editor/EditorFactory";

export abstract class AbstractInputMode implements IInputMode {
    protected editor: IEditor;
    constructor() {
        this.editor = EditorFactory.getInstance().getEditor();
    }
    abstract reset(): void;
    abstract lowerAlphabetInput(key: string): void;
    abstract upperAlphabetInput(key: string): void;
    abstract spaceInput(): void;
    abstract ctrlJInput(): void;
    abstract ctrlGInput(): void;
    abstract enterInput(): void;
    abstract backspaceInput(): void;
    abstract numberInput(key: string): void;
    abstract symbolInput(key: string): void;
}