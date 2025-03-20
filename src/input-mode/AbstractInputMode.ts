import { IInputMode } from "./IInputMode";
import { IEditor } from "../editor/IEditor";
import { EditorFactory } from "../editor/EditorFactory";

export abstract class AbstractInputMode implements IInputMode {
    protected editor: IEditor;
    constructor() {
        this.editor = EditorFactory.getInstance().getEditor();
    }
    abstract reset(): Promise<void>;
    abstract lowerAlphabetInput(key: string): Promise<void>;
    abstract upperAlphabetInput(key: string): Promise<void>;
    abstract spaceInput(): Promise<void>;
    abstract ctrlJInput(): Promise<void>;
    abstract ctrlGInput(): Promise<void>;
    abstract enterInput(): Promise<void>;
    abstract backspaceInput(): Promise<void>;
    abstract numberInput(key: string): Promise<void>;
    abstract symbolInput(key: string): Promise<void>;
}