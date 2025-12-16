# 営業日報システム

営業担当者の日報管理システムです。訪問記録の管理、上長からのコメント機能を提供します。

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **バックエンド**: Hono (APIルーティング)
- **データベース**: MongoDB (Prisma ORM)
- **テスト**: Vitest, Playwright

## 機能

### 日報管理
- 日報の作成・編集・削除
- 訪問記録の登録（顧客、時間、活動内容）
- 課題・問題点の記録
- 翌日の予定の記録

### コメント機能
- 上長からのフィードバック
- 日報へのコメント追加・削除

### 顧客マスタ
- 顧客情報の管理（CRUD）

## セットアップ

### 前提条件
- Node.js 18以上
- MongoDB

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# DATABASE_URLを設定

# Prisma Clientの生成
npx prisma generate

# 開発サーバーの起動
npm run dev
```

### 環境変数

```
DATABASE_URL=mongodb://localhost:27017/daily-report
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# Lint
npm run lint

# テスト（単体）
npm run test:unit

# テスト（E2E）
npm run test:e2e
```

## プロジェクト構成

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # APIルート（Hono）
│   └── reports/           # 日報画面
├── components/            # Reactコンポーネント
│   ├── layout/           # レイアウト
│   ├── reports/          # 日報関連
│   └── ui/               # 共通UIコンポーネント
├── lib/                   # ライブラリ・ユーティリティ
│   ├── api/              # Hono APIルート定義
│   └── db/               # Prisma Client
└── types/                 # TypeScript型定義
```

## API エンドポイント

### 日報
- `GET /api/reports` - 日報一覧取得
- `GET /api/reports/:id` - 日報詳細取得
- `POST /api/reports` - 日報作成
- `PUT /api/reports/:id` - 日報更新
- `DELETE /api/reports/:id` - 日報削除

### コメント
- `POST /api/reports/:id/comments` - コメント追加
- `DELETE /api/reports/:id/comments/:commentId` - コメント削除

### 顧客
- `GET /api/customers` - 顧客一覧取得
- `GET /api/customers/:id` - 顧客詳細取得
- `POST /api/customers` - 顧客作成
- `PUT /api/customers/:id` - 顧客更新
- `DELETE /api/customers/:id` - 顧客削除

## ライセンス

MIT
