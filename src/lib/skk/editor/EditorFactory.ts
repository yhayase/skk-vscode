import { IEditor } from './IEditor';

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
            throw new Error('EditorFactory is not initialized. Call initialize() first.');
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

    private static originalInstance: EditorFactory;
    // テスト用にインスタンスを直接設定できるメソッド
    public static setInstance(editor: IEditor): void {
        this.originalInstance = this.instance;
        EditorFactory.instance = new EditorFactory(() => editor);
    }

    // テスト後のクリーンアップ用
    public static reset(): void {
        EditorFactory.instance = this.originalInstance;
    }
}