# Project Brief: skk-vscode

## Overview
skk-vscode は、VSCode エディタ内で SKK (Simple Kana to Kanji) 日本語入力メソッドを実装する VSCode 拡張機能です。SKK は元々 Emacs 用に開発されたものであり、このプロジェクトはその機能を VSCode にもたらすことを目的としています。

## Core Requirements

1. **Japanese Input Method**
   - VSCode 内に完全な SKK スタイルの日本語入力システムを実装する
   - 様々な入力モード（ひらがな、カタカナ、ASCII、全角）をサポートする
   - 辞書検索によるかな漢字変換を可能にする

2. **Dictionary System**
   - 複数の辞書をサポートする
   - 辞書ソースの設定を可能にする
   - 郵便番号辞書のサポートを有効にする
   - 辞書管理（エントリの追加と削除）をサポートする

3. **Conversion Features**
   - 最初の3候補のインライン変換をサポートする
   - 追加候補のメニューベース変換を実装する
   - 変換における送り仮名を処理する

4. **Dictionary Registration**
   - ユーザーが新しい単語と読みのペアをユーザー辞書に登録できるようにする
   - SKK の慣例に一致する登録ワークフローを実装する

## Project Goals

1. **Usability**
   - VSCode 内でシームレスな日本語入力体験を作成する
   - 可能な限り DDSKK (Emacs SKK 実装) の動作に一致させる
   - 必要に応じて VSCode 拡張機能の制限を回避する

2. **Performance**
   - 応答性の高い入力と変換を保証する
   - 辞書検索を最適化する

3. **Extensibility**
   - システムを保守可能かつ拡張可能に設計する
   - コンポーネント間の明確な抽象化を使用する

## Current Version
0.1.0 (ff8a909, 4 weeks ago)

## Development Focus
現在の開発の焦点は、**キーバインドの文脈化と最適化 (Issue #55)** の完了です。これには、VSCode の `when` 句コンテキストを使用した、よりきめ細かいキーバインド制御の改善と、関連するテストの拡充が含まれます。
また、ドキュメントの日本語化と継続的な保守も重要な焦点です。
