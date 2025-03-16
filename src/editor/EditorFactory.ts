import { IEditor } from './IEditor';
import { VSCodeEditor } from './VSCodeEditor';

export type EditorCreator = () => IEditor;

export class EditorFactory {
    private static instance: EditorFactory;
    private editorCreator: EditorCreator;

    private constructor(editorCreator: EditorCreator) {
        this.editorCreator = editorCreator;
    }

    public static initialize(editorCreator: EditorCreator): void {
        if (!EditorFactory.instance) {
            EditorFactory.instance = new EditorFactory(editorCreator);
        }
    }

    public static getInstance(): EditorFactory {
        if (!EditorFactory.instance) {
            // デフォルトのエディタ作成関数を使用して初期化
            EditorFactory.initialize(() => new VSCodeEditor());
        }
        return EditorFactory.instance;
    }

    public getEditor(): IEditor {
        return this.editorCreator();
    }

    // テスト用にエディタ作成関数を変更できるメソッド
    public static resetForTest(editorCreator: EditorCreator): void {
        EditorFactory.instance = new EditorFactory(editorCreator);
    }
}