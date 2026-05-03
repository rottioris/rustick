# Rustick への貢献

Rustick への貢献に興味をお持ちいただきありがとうございます！このガイドではじめ方を説明します。

## 行動規範

尊重し、建设的であるようにしましょう。すべての背景を持つ貢献者を受け入れます。

## 貢献方法

### バグの報告

1. バグが [すでに存在する](https://github.com/rottioris/rustick/issues) か確認します
2. 新しい issue をオープンします：
   - 明確なタイトル
   - 再現の手順
   - 期待される行動 vs 実際の行動
   - 該当する場合はスクリーンショット

### 機能の提案

1. [既存の提案](https://github.com/rottioris/rustick/issues) を検索します
2. `feature-request` としてタグ付けされた新しい issue をオープンします
3. ユースケースと提案されたソリューションを説明します

### Pull Requests

1. リポジトリを **Fork** します

```bash
git clone https://github.com/あなたのユーザー名/rst-timer.git
cd rst-timer
```

2. 新しいブランチを作成します

```bash
git checkout -b feature/私の新しい機能
```

3. 変更を行いコミットします

```bash
git add .
git commit -m "新しい機能を追加"
```

4. あなたの fork にプッシュします

```bash
git push origin feature/私の新しい機能
```

5. **Pull Request** をオープンします

### 開発環境のセットアップ

```bash
# 依存関係をインストール
npm install

# 開発モードを開始
npm run tauri dev
```

### コーディング標準

- フロントエンドのコードには TypeScript を使用
- バックエンドのロジックには Rust を使用
- コミット前に `npm run build` を実行
- 変更は焦点を絞り、最小限に保ちます

## リソース

- [GitHub リポジトリ](https://github.com/rottioris/rustick)
- [Issues](https://github.com/rottioris/rustick/issues)
- [ディスカッション](https://github.com/rottioris/rustick/discussions)