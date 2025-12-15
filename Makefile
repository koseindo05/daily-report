# ============================================
# 営業日報システム Makefile
# ============================================

.PHONY: help install dev build start lint test deploy db-push db-studio clean

# デフォルトターゲット
help:
	@echo "利用可能なコマンド:"
	@echo ""
	@echo "  make install     - 依存関係をインストール"
	@echo "  make dev         - 開発サーバーを起動"
	@echo "  make build       - プロダクションビルド"
	@echo "  make start       - プロダクションサーバーを起動"
	@echo ""
	@echo "  make lint        - ESLintを実行"
	@echo "  make lint-fix    - ESLintを実行して自動修正"
	@echo ""
	@echo "  make test        - 全テストを実行"
	@echo "  make test-unit   - 単体テストを実行"
	@echo "  make test-e2e    - E2Eテストを実行"
	@echo "  make test-cov    - カバレッジレポートを生成"
	@echo ""
	@echo "  make db-generate - Prismaクライアントを生成"
	@echo "  make db-push     - スキーマをDBに反映"
	@echo "  make db-studio   - Prisma Studioを起動"
	@echo ""
	@echo "  make deploy-setup - Vercel初期設定（GitHub連携）"
	@echo "  make deploy-info  - デプロイ情報を表示"
	@echo ""
	@echo "  make clean       - ビルド成果物を削除"

# ============================================
# 開発
# ============================================

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

# ============================================
# Lint
# ============================================

lint:
	npm run lint

lint-fix:
	npm run lint:fix

# ============================================
# テスト
# ============================================

test:
	npm run test

test-unit:
	npm run test:unit

test-integration:
	npm run test:integration

test-e2e:
	npm run test:e2e

test-cov:
	npm run test:coverage

# ============================================
# データベース (Prisma)
# ============================================

db-generate:
	npx prisma generate

db-push:
	npx prisma db push

db-studio:
	npx prisma studio

# ============================================
# デプロイ (Vercel - GitHub連携)
# ============================================

# Vercel初期設定（GitHub連携でデプロイする場合の手順）
deploy-setup:
	@echo "============================================"
	@echo "Vercel GitHub連携デプロイ設定手順"
	@echo "============================================"
	@echo ""
	@echo "1. GitHubリポジトリを作成してプッシュ:"
	@echo "   git remote add origin https://github.com/YOUR_USERNAME/daily-report.git"
	@echo "   git push -u origin main"
	@echo ""
	@echo "2. Vercelでプロジェクトをインポート:"
	@echo "   - https://vercel.com/new にアクセス"
	@echo "   - GitHubリポジトリ 'daily-report' を選択"
	@echo "   - Framework Preset: Next.js を選択"
	@echo ""
	@echo "3. 環境変数を設定:"
	@echo "   - DATABASE_URL: MongoDB接続文字列"
	@echo "   - JWT_SECRET: JWT署名用シークレット"
	@echo ""
	@echo "4. デプロイ:"
	@echo "   - mainブランチへのpushで自動デプロイ"
	@echo "   - PRを作成するとプレビューデプロイ"
	@echo ""
	@echo "============================================"

# デプロイ情報を表示
deploy-info:
	@echo "============================================"
	@echo "デプロイ情報"
	@echo "============================================"
	@echo "プロジェクト名: daily-report"
	@echo "デプロイ方法: GitHub連携（自動デプロイ）"
	@echo ""
	@echo "ブランチ戦略:"
	@echo "  - main: 本番環境に自動デプロイ"
	@echo "  - PR: プレビュー環境にデプロイ"
	@echo ""
	@echo "必要な環境変数:"
	@echo "  - DATABASE_URL"
	@echo "  - JWT_SECRET"
	@echo ""
	@echo "Vercelダッシュボード:"
	@echo "  https://vercel.com/dashboard"
	@echo "============================================"

# GitHub連携用: リポジトリ初期化
git-init:
	@if [ ! -d .git ]; then \
		git init; \
		git branch -m main; \
	fi
	@echo "Git initialized"

# GitHub連携用: 初回コミット
git-first-commit:
	git add .
	git commit -m "Initial commit: 営業日報システム"

# ============================================
# クリーンアップ
# ============================================

clean:
	rm -rf .next
	rm -rf node_modules/.cache
	rm -rf coverage
	rm -rf playwright-report
	rm -rf test-results

clean-all: clean
	rm -rf node_modules
	rm -rf package-lock.json
