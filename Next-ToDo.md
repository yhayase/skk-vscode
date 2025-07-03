### 接尾辞変換のタスクリスト

1.  [x] **(Red) ユニットテストの追加**
    -   `test/unit/lib/skk/input-mode/henkan/InlineHenkanMode.test.ts` にテストケースを追加しました。テストは成功しています。

2.  [x] **(Green) 実装**
    -   `InlineHenkanMode` の `onSymbol` メソッドに `>` 入力時のロジックを実装しました。ただし、`MidashigoMode` に `setString` メソッドは実装されておらず、`Next-ToDo.md` に記載の手順とは一部異なります。テストは成功しています。

3.  [x] **(Refactor) リファクタリング**
    -   MidashigoMode.ts の Promise チェーンを async/await に統一しました。
    -   onSymbol メソッドの責務分割は、現時点では見送りました。
    -   テストが通る状態を維持しながら、関連コードを整理しました。
