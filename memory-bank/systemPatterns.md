# System Patterns: skk-vscode

## System Architecture

skk-vscode 拡張機能は、関心事の明確な分離を持つ階層化アーキテクチャに従います。

```
┌─────────────────────────────────────────┐
│              VSCode Layer               │
│  (VSCodeEditor, VSCodeJisyoProvider)    │
├─────────────────────────────────────────┤
│              Core SKK Layer             │
│  (Input Modes, Conversion, Dictionary)  │
├─────────────────────────────────────────┤
│            Abstraction Layer            │
│         (IEditor, IJisyoProvider)       │
└─────────────────────────────────────────┘
```

1. **VSCode Layer** - VSCode API との統合を処理します
   - VSCode に固有のエディタインタラクションを実装します
   - VSCode 固有の辞書読み込みと設定を管理します

2. **Core SKK Layer** - コア SKK 機能を含みます
   - 入力モードと状態遷移を実装します
   - 変換ロジックと候補選択を処理します
   - 辞書検索と登録を管理します

3. **Abstraction Layer** - エディタと辞書操作のためのインターフェースを提供します
   - 将来的に他のエディタへの適応を可能にします
   - モック実装によるテストを可能にします

## Key Technical Decisions

1. **Mode-Based State Machine**
   - システムは入力モードにステートマシンパターンを使用します
   - 各モード（ひらがな、カタカナ、ASCII など）は個別のクラスです
   - CandidateDeletionMode などの特殊なモードは特定のインタラクションを処理します
   - モード遷移は明確に定義されたイベントを通じて処理されます

2. **Editor Abstraction**
   - IEditor インターフェースはエディタ操作を抽象化します
   - 実際の VSCode 依存関係なしでのテストを可能にします
   - 将来的に他のエディタへの適応を可能にします

3. **Dictionary System**
   - 複数の辞書プロバイダを設定できます
   - 辞書は優先順位で検索されます
   - ユーザー辞書は検索で最も高い優先順位が与えられます

4. **Dictionary Management**
   - 登録は以下の組み合わせとして実装されます。
     - 特定のフォーマットを持つ専用のエディタタブ
     - 登録を開いて処理するためのコマンド
     - 登録された単語を元のコンテキストに挿入するロジック
   - 削除は以下のように実装されます。
     - 確認のための専用モード (CandidateDeletionMode)
     - Y/N オプション付きの確認ダイアログ
     - 確認時の辞書更新

5. **Contextual Keybinding Control (Issue #55) - Implemented**
   - VSCode の `when` 句コンテキストを利用してキーバインドを有効/無効にします。
   - **Core SKK Layer**: 各 `IInputMode` 実装は現在以下を持ちます。
     - `getActiveKeys(): Set<string>`: モードが現在処理する正規化されたキー名のセット (例: "a", "ctrl+j", "space") を返します。
     - `getContextualName(): string`: モードの文字列識別子 (例: "ascii", "hiragana:kakutei", "midashigo") を返します。
   - **VSCode Layer (`VSCodeEditor.ts`)**:
     - 2つの主要なカスタムコンテキストを管理します。
       - `skk.mode`: `currentMode.getContextualName()` の値に設定されます。
       - `skk.activeKey.[SAFE_KEY_NAME]`: ブール値。`SAFE_KEY_NAME` (正規化されたキーから `keyUtils.getActiveKeyContext` を介して派生) が現在のモードの `getActiveKeys()` セットに含まれている場合は `true`、それ以外の場合は `false` に設定されます。
     - `updateSkkContexts()` メソッドは `vscode.commands.executeCommand('setContext', ...)` を使用してこれらのコンテキストを更新します。
     - コンテキストは入力モードが変更されたとき (`setInputMode`)、または入力モードがアクティブキーに影響を与える可能性のある内部状態の変更を通知したとき (`notifyModeInternalStateChanged`) に更新されます。
   - **`package.json`**: キーバインドは現在 `when: "editorTextFocus && skk.activeKey.[SAFE_KEY_NAME]"` を使用して、特定のキーが現在の SKK 状態に関連する場合にのみ発行されるようにします。
   - **`keyUtils.ts`**: ヘルパー関数 `normalizeVscodeKey` (`package.json` からのキー名を標準化するため) と `getActiveKeyContext` (正規化されたキー名から安全なコンテキストキーサフィックスを生成するため) を提供します。
   - このアプローチは、SKK が現在の状態で処理しようとするキーのみをインターセプトすることを保証することで、競合を最小限に抑えます。

## Design Patterns in Use

1. **State Pattern**
   - 入力モードは状態として実装されます
   - 各状態は現在のモードに基づいて入力を異なる方法で処理します
   - 状態間の遷移は明示的かつ明確に定義されています

2. **Strategy Pattern**
   - 入力コンテキストに基づいたさまざまな変換戦略
   - さまざまな変換シナリオの特殊な処理を可能にします

3. **Factory Pattern**
   - モード作成はファクトリメソッドを通じて処理されます
   - モードの適切な初期化と設定を保証します

4. **Observer Pattern**
   - エディタイベントは適切なモード遷移をトリガーします
   - ユーザー入力のリアクティブな処理を可能にします

5. **Command Pattern**
   - VSCode コマンドは特定のアクションをトリガーするために使用されます
   - ユーザーインタラクションのためのクリーンなインターフェースを提供します

## Component Relationships

1. **Input Modes and Conversion**
   - 入力モードは適切な場合に変換モードに移行します
   - 変換モードは候補選択と確定を処理します
   - 確定後、制御は元の入力モードに戻ります

2. **Editor and Modes**
   - モードはエディタ抽象化を使用してテキストを操作します
   - エディタイベントはモード遷移とアクションをトリガーします

3. **Dictionary and Conversion**
   - 変換モードは候補を辞書に問い合わせます
   - 辞書の結果が利用可能な変換オプションを決定します

4. **Registration and Dictionary**
   - 登録プロセスはユーザー辞書にエントリを追加します
   - ユーザー辞書エントリは将来の変換ですぐに利用可能になります

5. **SKK Core and VSCode Layer (for Keybinding Context) - Updated**
   - コア SKK レイヤー (現在の `IInputMode` インスタンス) は、`getContextualName()` を介してコンテキスト名を提供し、`getActiveKeys()` を介して現在処理されているキーのセットを提供します。
   - VSCode レイヤー (`VSCodeEditor`):
     - 現在の入力モードからこの情報を取得します。
     - `skk.mode` コンテキストをコンテキスト名で更新します。
     - アクティブなキーと以前にアクティブだったキーを反復処理して、`skk.activeKey.[SAFE_KEY_NAME]` ブール値コンテキストを設定/解除します。
     - キーの命名とコンテキストキー生成の一貫性を確保するために `keyUtils.ts` を使用します。
   - これにより、`package.json` のキーバインドは、`getActiveKeys()` がモードに依存するため、ほとんどの場合 `skk.mode` を明示的にチェックする必要なく、`skk.activeKey.*` に条件付きにすることができます。

## Critical Implementation Paths

1. **Input to Conversion Flow**
   - かなモードでのユーザー入力 → 変換トリガー → 辞書検索 → 候補表示 → 選択 → 確定

2. **Registration Flow**
   - 候補が見つからない (またはこれ以上ない) → 登録エディタが開く → ユーザーが単語を入力 → 登録コマンド → 辞書更新 → 単語挿入

3. **Deletion Flow**
   - 変換中に X を押す → CandidateDeletionMode がアクティブになる → 確認ダイアログ → Y で削除を確定 / N でキャンセル → 確定された場合は辞書を更新

4. **Mode Transition Flow**
   - モード固有のキーが検出される → 現在のモードのクリーンアップ → 新しいモードの初期化 → エディタ状態の更新
