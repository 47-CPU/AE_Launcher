# AE Script Launcher — セットアップガイド

---

## ユーザーの操作フロー（完成後）

```
① ランチャー.app / .exe をダブルクリック
② AEのバージョンが自動検出される（手動不要）
③ レジストリURLを1回だけ入力
④ インストールしたいスクリプトの「インストール」を押す
⑤ AEを再起動 → 即使える
```

---

## あなた（配布者）のセットアップ

### 必要なもの
- Node.js（https://nodejs.org からインストール）
- GitHubアカウント

---

### ① このフォルダをGitHubにアップロード

GitHubで新しいリポジトリを作成（**Privateでも可**）して、
このフォルダの中身をすべてアップロードしてください。

```
your-repo/
├── package.json
├── src/
│   ├── main.js
│   ├── preload.js
│   └── index.html
├── scripts/            ← スクリプト本体を置くフォルダ
│   └── example/
│       └── main.jsx
└── registry.json       ← スクリプト一覧
```

---

### ② アプリのビルド（配布用.app / .exe を作る）

ターミナル（Mac）またはコマンドプロンプト（Win）で：

```bash
# このフォルダに移動
cd ae-launcher-electron

# 必要なパッケージをインストール（初回のみ）
npm install

# Mac用ビルド
npm run build:mac

# Windows用ビルド
npm run build:win

# 両方同時にビルド
npm run build:all
```

`dist/` フォルダに以下が生成されます：
- Mac: `AE Script Launcher.dmg`
- Win: `AE Script Launcher Setup.exe`

これをユーザーに配布するだけです。

---

### ③ テスト起動（ビルドしなくても動作確認できる）

```bash
npm install   # 初回のみ
npm start     # ランチャーが起動する
```

---

## スクリプトの配布・更新方法

### 新しいスクリプトを追加するとき

1. `scripts/スクリプトID/` フォルダを作ってファイルを置く
2. `registry.json` にエントリを追加
3. GitHubにpush → ユーザーのランチャーに即反映

### registry.json の書き方

```json
{
  "scripts": [
    {
      "id": "my-tool-v1",
      "name": "ツール名",
      "description": "説明文をここに書く",
      "version": "1.0.0",
      "type": "script",
      "category": "utility",
      "free": true,
      "file_name": "MyTool.jsx",
      "download_url": "https://raw.githubusercontent.com/ユーザー名/リポジトリ名/main/scripts/my-tool-v1/MyTool.jsx",
      "changelog": "初回リリース",
      "updated": "2025-01-01"
    }
  ]
}
```

### アップデートするとき

1. スクリプトファイルを更新してpush
2. `registry.json` の `version` と `changelog` だけ更新してpush

```json
"version": "1.1.0",
"changelog": "〇〇のバグを修正",
"updated": "2025-02-01"
```

→ ユーザーのランチャーに「アップデート」ボタンが自動で表示されます

---

## Privateリポジトリでの配布

GitHubリポジトリをPrivateにする場合、
スクリプト本体のダウンロードURLが認証必須になります。

**解決策：Google Driveを使う**

1. スクリプトファイルをGoogle Driveにアップロード
2. 共有設定を「リンクを知っている全員が閲覧可能」に設定
3. 共有URLから直リンクURLに変換：
   ```
   共有URL:   https://drive.google.com/file/d/XXXXXXXX/view
   直リンク:  https://drive.google.com/uc?export=download&id=XXXXXXXX
   ```
4. この直リンクを registry.json の `download_url` に設定

---

## type / category の値一覧

| type | 内容 |
|------|------|
| script | .jsx スクリプト |
| plugin | .aex プラグイン |
| preset | アニメーションプリセット |
| expression | エクスプレッション |

| category | 内容 |
|----------|------|
| utility | 汎用ツール |
| motion | モーション |
| color | カラー |
| text | テキスト |
| render | レンダリング |
