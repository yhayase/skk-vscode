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
     * サブクラスからのみ呼び出されるコンストラクタ．
     * @param name 変換モードの名前
     */
    protected constructor(name: string) {
        this.name = name;
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
    abstract onLowerAlphabet(context: AbstractKanaMode, key: string): void;

    /**
     * 大文字アルファベットの入力を受け付ける．
     * @param context
     * @param ch
     */
    abstract onUpperAlphabet(context: AbstractKanaMode, key: string): void;

    /**
     * 数字の入力を受け付ける．
     * @param context
     * @param ch
     */
    abstract onNumber(context: AbstractKanaMode, key: string): void;

    /**
     * 記号の入力を受け付ける．
     */
    abstract onSymbol(context: AbstractKanaMode, key: string): void;

    /**
     * スペースの入力を受け付ける．
     * @param context
     */
    abstract onSpace(context: AbstractKanaMode): void;

    /**
     * Enter の入力を受け付ける．
     * @param context
     */
    abstract onEnter(context: AbstractKanaMode): void;

    /**
     * Backspace の入力を受け付ける．
     * @param context
     */
    abstract onBackspace(context: AbstractKanaMode): void;

    /**
     * C-j の入力を受け付ける．
     * @param context
     */
    abstract onCtrlJ(context: AbstractKanaMode): void;

    /**
     * C-g の入力を受け付ける．
     */
    abstract onCtrlG(context: AbstractKanaMode): void;
}