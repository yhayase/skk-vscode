import { IEditor } from "../../editor/IEditor";
import { AbstractKanaMode } from "../AbstractKanaMode";

/**
 * SKK の変換モード (■，▽，▼モードのいずれか) の抽象基底クラス．
 * キーボード入力を受け付けて、バッファとやりとりをする．
 * このクラスを継承して、変換モードを実装する．
 */
export abstract class AbstractHenkanMode {
    /**
     * 変換モードの名前．
     * この名前は、モード切り替え時にモード名表示に使われる．
     */
    protected name: string;

    /**
     * テキスト編集やカーソル移動，変換候補の表示などを行うための IEditor インスタンス．
     */
    protected editor: IEditor;

    /**
     * サブクラスからのみ呼び出されるコンストラクタ．
     * @param name 変換モードの名前
     */
    protected constructor(name: string, editor: IEditor) {
        this.name = name;
        this.editor = editor;
    }

    /**
     * 変換モードの名前を返す．
     */
    getName(): string {
        return this.name;
    }

    /**
     * 小文字アルファベットの入力を受け付ける．
     * @param context  
     * @param ch 
     */
    abstract onLowerAlphabet(context: AbstractKanaMode, key: string): Promise<void>;

    /**
     * 大文字アルファベットの入力を受け付ける．
     * @param context
     * @param ch
     */
    abstract onUpperAlphabet(context: AbstractKanaMode, key: string): Promise<void>;

    /**
     * 数字の入力を受け付ける．
     * @param context
     * @param ch
     */
    abstract onNumber(context: AbstractKanaMode, key: string): Promise<void>;

    /**
     * 記号の入力を受け付ける．
     */
    abstract onSymbol(context: AbstractKanaMode, key: string): Promise<void>;

    /**
     * スペースの入力を受け付ける．
     * @param context
     */
    abstract onSpace(context: AbstractKanaMode): Promise<void>;

    /**
     * Enter の入力を受け付ける．
     * @param context
     */
    abstract onEnter(context: AbstractKanaMode): Promise<void>;

    /**
     * Backspace の入力を受け付ける．
     * @param context
     */
    abstract onBackspace(context: AbstractKanaMode): Promise<void>;

    /**
     * C-j の入力を受け付ける．
     * @param context
     */
    abstract onCtrlJ(context: AbstractKanaMode): Promise<void>;

    /**
     * C-g の入力を受け付ける．
     */
    abstract onCtrlG(context: AbstractKanaMode): Promise<void>;

    /**
     * この変換モードでアクティブなキーのセットを返す．
     * デフォルトでは空のセットを返す．具象クラスでオーバーライドして、
     * 実際に処理するキーを返すようにする．
     */
    public getActiveKeys(): Set<string> {
        return new Set<string>();
    }

    /**
     * この変換モードのコンテキスト名を返す．
     * (例: "kakutei", "midashigo", "henkan")
     */
    public abstract getContextualName(): string;
}
