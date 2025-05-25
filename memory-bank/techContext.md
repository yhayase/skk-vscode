# Technical Context: skk-vscode

## Technologies Used

1. **TypeScript**
   - 主要な開発言語
   - 型安全性と最新のJavaScript機能を提供
   - すべての拡張機能コードに使用

2. **VSCode Extension API**
   - VSCodeエディタとの統合に使用
   - エディタ操作機能を提供
   - コマンドの登録と実行を処理

3. **Node.js**
   - 拡張機能のランタイム環境
   - ファイルシステム操作（辞書読み込み）に使用

4. **Mocha & Chai**
   - ユニットテストおよび統合テストに使用されるテストフレームワーク
   - テスト駆動開発アプローチを可能にする

## Development Setup

1. **Project Structure**
   - `/src`: ソースコード
     - `/extension.ts`: 拡張機能のエントリポイント
     - `/VSCodeEditor.ts`: VSCode固有のエディタ実装
     - `/VSCodeJisyoProvider.ts`: VSCode固有の辞書プロバイダ
     - `/lib/skk/`: コアSKK機能
       - `/input-mode/`: 入力モード実装
       - `/input-mode/henkan/`: 変換モード実装
       - `/jisyo/`: 辞書関連の実装
       - `/editor/`: エディタ抽象化レイヤー
   - `/test`: テストコード
     - `/unit`: ユニットテスト
     - `/integration`: 統合テスト

2. **Build System**
   - バンドルにはwebpackを使用
   - TypeScriptコンパイルはtsconfig.jsonで設定
   - 本番ビルド用に個別のtsconfig.build.json

3. **Testing Environment**
   - コア機能のユニットテスト
   - VSCode固有機能の統合テスト
   - 完全なワークフローのE2Eテスト

## Technical Constraints

1. **VSCode Extension Limitations**
   - UIカスタマイズ機能の制限
   - エディタ内部へのアクセス制限
   - 拡張機能コードのパフォーマンスに関する考慮事項

2. **Dictionary Performance**
   - 大規模な辞書を効率的に読み込み、検索する必要がある
   - メモリ使用量を慎重に管理する必要がある

3. **Input Handling**
   - VSCodeの入力システムと連携する必要がある
   - キーイベントを適切に処理する必要がある
   - 他の拡張機能やVSCodeのキーバインドとの潜在的な競合

## Dependencies

1. **Core Dependencies**
   - VSCode Extension API
   - Node.js標準ライブラリ

2. **Development Dependencies**
   - TypeScript
   - Webpack
   - ESLint
   - Mocha & Chai (テスト用)

## Tool Usage Patterns

1. **VSCode Commands**
   - 拡張機能の機能はVSCodeコマンドを通じて公開される
   - コマンドは拡張機能のアクティベーション時に登録される
   - コマンドは一貫性のために `skk.<action>Input` のパターンに従う

2. **Editor Manipulation**
   - エディタ抽象化によるテキストの挿入と削除
   - カーソルと選択範囲管理のための位置追跡
   - 視覚的なフィードバックのための装飾処理

3. **Dictionary Access**
   - 辞書プロバイダはIJisyoProviderインターフェースを実装
   - 辞書エントリはパフォーマンスのためにキャッシュされる
   - ユーザー辞書はセッション間で永続化される
   - 辞書操作には検索、登録、削除が含まれる

4. **Testing Approach**
   - コアロジックのユニットテスト
   - VSCode固有機能の統合テスト
   - 完全なワークフローのE2Eテスト
   - 新機能のためのテスト駆動開発
