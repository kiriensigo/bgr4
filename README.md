# BGR プロジェクト

## 📂 **クリーンで統一された構成**

```
bgr/
├── README.md                    ← このファイル（プロジェクト概要）
├── CLAUDE.md                    ← Claude用指示書
├── bgr-v2/                      ← 🔥 メインプロジェクト
│   ├── src/                     ← ソースコード
│   │   ├── app/                 ← Next.js App Router
│   │   ├── components/          ← Reactコンポーネント
│   │   ├── lib/                 ← ライブラリ・ユーティリティ
│   │   └── __tests__/           ← 単体テスト
│   ├── e2e/                     ← E2Eテスト
│   ├── scripts/                 ← 開発スクリプト
│   │   ├── test/                ← テスト・デバッグスクリプト
│   │   └── seed-database.js     ← データベースシード
│   ├── package.json             ← 依存関係
│   └── next.config.ts           ← 設定ファイル
└── docs/                        ← 📚 統合ドキュメント
    ├── README.md                ← ドキュメントガイド
    ├── requirements-*.md         ← 要件定義
    ├── 004_review_system_mockup.md  ← モックアップ
    ├── development-guidelines.md ← 開発ルール
    ├── mockups/                 ← UI設計
    ├── database-schema*.sql     ← DB設計
    ├── completed/               ← 完了チケット
    └── 001-003_*.md            ← 進捗管理
```

## 🎯 **重要ドキュメント**

### 🔥 **今すぐ確認**
1. **[ドキュメント全体ガイド](docs/README.md)** - すべてのドキュメント案内
2. **[統合要件定義書](docs/requirements-consolidated.md)** - プロジェクト全体の要件
3. **[レビューシステム詳細要件v2](docs/review-requirements.md)** - 現在開発中の機能
4. **[チケット004モックアップ](docs/004_review_system_mockup.md)** - 実装予定の設計

### 📱 **開発関連**
- **[開発ガイドライン](docs/development-guidelines.md)** - テストファイル管理等のルール
- **[モックアップ集](docs/mockups/)** - UI/UXデザイン
- **[データベース設計](docs/database-schema-fixed.sql)** - 最新DBスキーマ

### 💻 **実装・コード**
- **ソースコード**: `bgr-v2/src/`
- **テストスクリプト**: `bgr-v2/scripts/test/`
- **設定ファイル**: `bgr-v2/package.json`, `bgr-v2/next.config.ts`

## 📈 **プロジェクト状況**

### ✅ **完了済み (21チケット)**
- 基盤セットアップ・環境構築
- Supabase データベース設定
- OAuth認証システム (Twitter/Google)
- BGG API 連携機能
- ゲーム管理・検索機能
- 基本レビューシステム
- 管理パネル・UI/UX デザイン実装
- ホームページ・SEO最適化
- テスト環境・Netlify デプロイ設定
- セキュリティ・パフォーマンス・アクセシビリティ対応
- コード品質・監視システム

### 🔄 **進行中**
- **レビューシステムv2実装** (チケット004) ← 現在ここ
- 残りUIコンポーネント実装

### 📋 **次期予定**
- 単体テスト拡充
- 新機能追加
- パフォーマンスチューニング

## 🎨 **プロジェクト概要**

### **目的**
**短時間でレビューができる**ボードゲームレビューサイト

### **主要機能**
- **1-2分完了**: スライダーによる直感的評価
- **1ページ完結**: プレビューなしで即座投稿
- **モバイル最適化**: タッチ操作対応
- **Twitter連携**: ワンクリックでSNSシェア

### **技術スタック**
- **Next.js 14** (App Router) + TypeScript
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS** + shadcn/ui
- **Netlify** デプロイ

## 🔗 **リンク**

- **現在のサイト**: https://bgrq.netlify.app/
- **進捗詳細**: `docs/002_remaining_tasks_from_completed_tickets.md`
- **完了チケット**: `docs/completed/`

## 🚀 **開発開始方法**

```bash
cd bgr-v2
npm install
npm run dev
```

## 📊 **進捗数値**
- **完了チケット**: 21/24 (87.5%)
- **実装完了度**: 約90%
- **残作業**: 75項目
- **推定工数**: 4-6週間

---

**最終更新**: 2025-08-22  
**構成**: 完全統一・クリーン化完了  
**進捗管理**: TodoListで継続追跡中