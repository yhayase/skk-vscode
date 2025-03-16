import { IEditor } from './IEditor';
import { VSCodeEditor } from './VSCodeEditor';

export class EditorFactory {
    private static instance: EditorFactory;
    private editorMap = new WeakMap<object, IEditor>();

    private constructor() { }

    public static getInstance(): EditorFactory {
        if (!EditorFactory.instance) {
            EditorFactory.instance = new EditorFactory();
        }
        return EditorFactory.instance;
    }

    public getEditor(): IEditor {
        return new VSCodeEditor();
    }
}