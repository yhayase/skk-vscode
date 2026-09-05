# リリースガイド

本ドキュメントでは、VSCode SKK 拡張機能のリリース手順について説明します。
本プロジェクトでは、Visual Studio Marketplace への公開と GitHub Releases への登録を半自動化しています。

## 前提条件

リリース作業を行うには、Visual Studio Marketplace への発行権限（パブリッシャー `hayase`）が必要です。

事前に以下のいずれかの方法で認証を済ませておく必要があります。

1. **vsce login コマンドによる認証**:
   ```bash
   npx @vscode/vsce login hayase
   ```
   プロンプトが表示されたら、Personal Access Token (PAT) を入力します。

2. **環境変数による認証**:
   環境変数 `VSCE_PAT` に PAT を設定します。
   ```bash
   export VSCE_PAT="<Your-Personal-Access-Token>"
   ```

> [!NOTE]
> Azure DevOps で生成する PAT は、Marketplace の「Manage」スコープまたは「All accessible organizations」権限が必要です。

## リリース手順

### 1. 作業環境の確認
必ず `main` ブランチに切り替え、最新のコードを取得した上で、作業ツリーがクリーンな状態であることを確認します。

```bash
git checkout main
git pull origin main
git status
```

### 2. リリースノートの更新
`CHANGELOG.md` および `README.md` のリリースノートを更新し、変更内容をコミットします。

- 今回のバージョン番号、リリース日、追加機能、改善点、バグ修正などを記載します。
- 記載後、git でコミットします。

```bash
git add CHANGELOG.md README.md
git commit -m "docs: update release notes for vX.Y.Z"
```

### 3. リリースコマンドの実行
バージョンの変更規模（パッチ、マイナー、メジャー）に応じて、以下のいずれかのコマンドを実行します。

- **パッチリリース** (バグ修正など: 0.1.0 -> 0.1.1):
  ```bash
  npm run release:patch
  ```
- **マイナーリリース** (後方互換性のある機能追加: 0.1.0 -> 0.2.0):
  ```bash
  npm run release:minor
  ```
- **メジャーリリース** (破壊的変更: 0.1.0 -> 1.0.0):
  ```bash
  npm run release:major
  ```

### 4. 自動処理の流れ

リリースコマンドを実行すると、以下の処理が自動的に順次行われます。

1. **テストの実行**: `npm test`（単体テストおよび統合テスト）が実行され、すべてパスすることを確認します。テストが失敗した場合はリリース処理が中止されます。
2. **VS Code Marketplace への公開**: `vsce publish <type>` により以下の処理が行われます。
   - `package.json` のバージョンが更新されます。
   - 更新内容がコミットされ、バージョンタグ（例: `v0.2.0`）が作成されます。
   - 拡張機能がパッケージングされ、Marketplace に公開されます。
3. **タグとコミットのプッシュ**: `git push origin main --follow-tags` により、バージョン更新コミットと作成されたタグが GitHub リモートリポジトリへプッシュされます。
4. **GitHub Releases の自動生成**: タグのプッシュを検知して GitHub Actions ワークフロー（`.github/workflows/release.yml`）が起動します。
   - リポジトリのチェックアウト、依存関係インストール、単体テストの実行、拡張機能パッケージング（`.vsix` の生成）が行われます。
   - `softprops/action-gh-release` により GitHub Release が自動作成され、`.vsix` ファイルがアセットとして添付されます。このとき、`generate_release_notes: true` の設定により、前リリースからのコミットや PR の要約を含むリリースノートも自動生成されます。

## 注意事項

- **クリーンな作業ツリーの維持**: `vsce publish` は作業ツリーに変更が残っているとエラーになる場合があります。必ず事前にコミットまたはスタッシュしてください。
- **実行ブランチの確認**: リリースコマンドは必ず `main` ブランチで実行してください。
- **トークンの有効期限**: `vsce publish` 時に PAT の有効期限切れエラーが発生した場合は、Azure DevOps で新しい PAT を発行し、再度 `npx @vscode/vsce login hayase` または `VSCE_PAT` の再設定を行ってください。
- **パッケージ内容の事前確認**: リリース前にパッケージに含まれるファイルを確認したい場合は、`npx @vscode/vsce ls` を実行するのが推奨されます（一時ファイル `.vsix` を生成せずにパッケージ対象ファイルの一覧を確認できます）。実際のパッケージ生成を検証したい場合は `npm run package` を使用し、確認後に生成された `.vsix` ファイルを削除してください。
