# Active Context: skk-vscode

## Current Work Focus

現在の開発の焦点は以下です。
- **候補削除機能**の実装
- **辞書登録機能**の完成
- **キーバインドの文脈化と最適化 (Issue #55) - 基本実装完了**: VSCodeの`when`句コンテキストを使用したきめ細かいキーバインド制御の基礎作業が完了しました。これには、コアSKKロジック、VSCodeレイヤーのコンテキスト更新メカニズム、および`package.json`の変更が含まれます。残りの作業は、すべてのモードの完全なカバレッジと包括的なテストです。

候補削除機能により、ユーザーは変換中に不要な候補を辞書から削除できます。これは、誤ったエントリや古いエントリを削除するのに役立ちます。

辞書登録機能により、ユーザーは変換候補が見つからない場合や新しいエントリを追加したい場合に、新しい単語と読みのペアをユーザー辞書に追加できます。

### Registration Feature Implementation

登録機能は、入力モードのような独立した「モード」として実装されているのではなく、次の3つの要素の組み合わせとして実装されています。

1. **Registration Editor Tab**
   - 特定のフォーマットを持つ専用のエディタタブ
   - 読みと単語用の空のフィールドが含まれています
   - フォーマット: `読み:{reading}\n単語:`

2. **Registration Trigger**
   - 以下の場合にトリガーされます。
     - InlineHenkanModeで、最後の候補を過ぎて移動した場合
     - MenuHenkanModeで、最後の候補を過ぎて移動した場合
     - MidashigoModeで、候補が見つからなかった場合

3. **Registration Command**
   - 登録を処理するためのVSCodeコマンド
   - エディタから読みと単語を抽出します
   - ユーザー辞書にエントリを追加します
   - 登録エディタを閉じます
   - 元のエディタにフォーカスを戻します
   - 登録された単語をカーソル位置に挿入します

## Recent Changes

1. **Candidate Deletion Implementation**
   - 候補削除を処理するためのCandidateDeletionModeを実装しました
   - 削除の確認ダイアログ（Y/Nプロンプト）を追加しました
   - 辞書エントリ削除機能を実装しました
   - さまざまな入力コンテキスト（ひらがな、カタカナ、送り仮名）での削除のサポートを追加しました

2. **Registration Editor Opening**
   - InlineHenkanModeからの登録エディタのオープンを実装しました
   - MenuHenkanModeからの登録エディタのオープンを実装しました
   - MidashigoModeからの登録エディタのオープンを実装しました

3. **Registration Content Handling**
   - 登録エディタコンテンツの適切なフォーマットを実装しました
   - エディタでカタカナの読みをひらがなに変換するサポートを追加しました

4. **Registration Command**
   - ユーザー辞書にエントリを追加するための登録コマンドを実装しました
   - 登録後に登録エディタを閉じるロジックを追加しました
   - 元のエディタへのフォーカス復帰を実装しました
   - 登録後にカーソル位置に単語を挿入する機能を追加しました

5. **Testing**
   - 候補削除機能の統合テストを追加しました
   - 登録機能の統合テストを追加しました
   - さまざまな登録シナリオのテストを実装しました
   - 登録と削除における送り仮名処理のテストを追加しました

## Next Steps

**Issue #55: Keybinding Contextualization - Remaining Tasks**
-   **モード実装の完了**: 残りのすべての入力モードクラス（特に`InlineHenkanMode`、`MenuHenkanMode`、`AbbrevMode`、`CandidateDeletionMode`、およびその他の`AbstractHenkanMode`サブクラス）に対して`getActiveKeys()`と`getContextualName()`が完全に実装されていることを確認します。これらに包括的な単体テストを追加します。
-   **ターゲットを絞った統合テスト**: 以下を具体的に検証するために新しい統合テストを作成します。
    -   さまざまなモード遷移と状態における`skk.mode`および`skk.activeKey.*`コンテキスト値の正しさ。
    -   これらのコンテキストに基づいてキーバインドが正しく有効/無効になっていること、SKKが必要な場合にのみキーをキャプチャすることを確認します。
-   **手動テストとデバッグ**: すべてのSKK機能にわたって徹底的な手動テストを実施し、回帰や予期しないキーバインド動作を特定して修正します。
-   **パフォーマンスレビュー**: コンテキスト更新メカニズムが、特に急速なモード変更や入力中に顕著なパフォーマンスオーバーヘッドを引き起こすかどうかを評価します。必要に応じて最適化します。
-   **ドキュメント**: 変更が重要な場合は、キーバインドの動作に関する関連する開発者またはユーザードキュメントを更新します。

**Existing Next Steps**
1. **Candidate Deletion Enhancement**
   - 削除機能のキーボードショートカットのドキュメントを追加します
   - 複数の候補に対するメニューベースの削除オプションの追加を検討します
   - 削除操作のエラー処理を改善します

2. **Registration Mode Implementation**
   - 登録エディタ専用のモードを実装します
   - 登録モード用の特殊なキー処理を追加します

3. **Registration Command Enhancement**
   - キーボードショートカットで登録コマンドを実行するためのサポートを追加します
   - 無効な登録入力に対するエラー処理を改善します

4. **Refactoring**
   - 登録エディタを開くロジックの重複コードをリファクタリングします
   - 登録機能のアーキテクチャを改善します

5. **Documentation**
   - 登録機能と削除機能の両方を含むようにドキュメントを更新します
   - 両方のワークフローの使用例を追加します

## Active Decisions and Considerations

**Issue #55: Keybinding Contextualization - Key Decisions Made**
-   **実装されたコンテキスト設計**:
    -   `skk.mode`: `IInputMode.getContextualName()` を使用します (例: `"ascii"`、`"hiragana:kakutei"`、`"midashigo"`)。
    -   `skk.activeKey.[SAFE_KEY_NAME]`: `IInputMode.getActiveKeys()` と `keyUtils.getActiveKeyContext()` を使用して安全なコンテキストキーを生成します (例: `skk.activeKey.a`、`skk.activeKey.ctrl_j`、`skk.activeKey.num0`)。
-   **キー名の正規化**: `keyUtils.ts` は `normalizeVscodeKey` (`package.json` の `key` プロパティから内部表現へ) と `getActiveKeyContext` (内部表現からコンテキストキーサフィックスへ) を提供します。
-   **コンテキスト更新メカニズム**: `VSCodeEditor` は `setInputMode()` と `notifyModeInternalStateChanged()` によってトリガーされる `updateSkkContexts()` を介してコンテキスト更新を処理します。

**Issue #55: Keybinding Contextualization - Ongoing Considerations**
-   **パフォーマンス**: 特に多くのアクティブキーや急速な変更がある場合の `setContext` 呼び出しの影響を引き続き監視します。値が変更された場合にのみコンテキストを更新する最適化は `VSCodeEditor.updateSkkContexts` に実装されています。
-   **カバレッジと堅牢性**: すべてのモードとエッジケースが `getActiveKeys` と `getContextualName` によって正しく処理されるようにすることが重要です。一部のモード (多くの入力に対してエラーをスローするモードなど) のアクティブキーのリストは包括的である必要があります。
-   **`skk.mode` 値の明確さ**: `"hiragana:kakutei"` のような複合名は有益ですが、一貫して適用し、文書化する必要があります。

1. **Candidate Deletion Workflow**
   - 変換中に「X」キーを使用して削除モードをトリガーします
   -偶発的な削除を防ぐために明示的な確認（Y/N）を要求します
   - 削除の取り消し機能を追加するかどうかを検討しています

2. **Registration Editor Format**
   - 登録エディタに単純なテキスト形式を使用します
   - より多くの構造または検証を追加するかどうかを検討しています

3. **Registration Workflow**
   - 現在のワークフローはSKKの慣例に従っています
   - VSCode固有の改善が可能かどうかを評価しています

4. **Performance Considerations**
   - 辞書更新のパフォーマンスへの影響を監視しています
   - 登録および削除中のスムーズなユーザーエクスペリエンスを保証します

5. **Testing Strategy**
   - 統合テストを使用して完全なワークフローを検証します
   - 特定のコンポーネントに対する追加の単体テストを検討しています

## Important Patterns and Preferences

1. **Command-Based Interaction**
   - ユーザーインタラクションにVSCodeコマンドを使用します
   - コマンド命名に確立された `skk.<action>` のパターンに従います

2. **Editor Abstraction**
   - すべてのテキスト操作にエディタ抽象化を引き続き使用します
   - 登録および削除機能が抽象化レイヤーを介して機能することを確認します

3. **Mode-Based State Machine**
   - 特定のインタラクションを処理するために新しいモード（CandidateDeletionModeなど）を追加します
   - モード間の明確な遷移を維持します

4. **Test-Driven Development**
   - 機能実装と並行して、またはそれ以前にテストを実装します
   - さまざまなシナリオで正しい動作を検証するためにテストを使用します

## Learnings and Project Insights

1. **VSCode Editor Limitations**
   - VSCodeのエディタAPIの制限を回避します
   - SKKスタイルのインタラクションのための創造的な解決策を見つけます

2. **State Management Complexity**
   - モード間の複雑な状態遷移を管理します
   - 遷移中の適切なクリーンアップと初期化を保証します
   - 新しいモード（CandidateDeletionModeなど）を追加すると複雑さが増しますが、ユーザーエクスペリエンスが向上します

3. **Dictionary Management**
   - 辞書の柔軟性とパフォーマンスのバランスを取ります
   - 完全な辞書管理のために追加操作と削除操作の両方を実装します

4. **Testing Challenges**
   - 非同期エディタ操作のテストにおける課題に対処します
   - VSCode拡張機能の信頼性の高いテストパターンを開発します
   - 複雑なユーザーインタラクションのための包括的なテストを作成します
