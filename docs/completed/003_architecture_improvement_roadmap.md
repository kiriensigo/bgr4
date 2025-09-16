# チケット 003: アーキテクチャ改善ロードマップ

## 概要
コードレビュー結果を基にした、アーキテクチャ境界明確化とテスタビリティ向上のための段階的改善計画

**優先度**: High  
**想定期間**: 6-8週間  
**前提条件**: 基幹機能完了後

---

## 🚀 **Phase 1: 基盤改善（短期 - 2-3週間）**

### 1.1 Repository Pattern導入
- [x] GameRepositoryインターフェース定義
- [x] SupabaseGameRepository実装
- [x] ReviewRepositoryインターフェース定義
- [x] SupabaseReviewRepository実装
- [x] UserRepositoryインターフェース定義
- [x] SupabaseUserRepository実装
- [x] Mock Repository classes作成（テスト用）

### 1.2 Error Handling統一
- [x] DomainErrorsクラス基底定義
- [x] GameNotFoundError実装
- [x] ValidationError実装
- [x] DatabaseError実装
- [x] NetworkError実装
- [x] ErrorHandlerユーティリティ作成
- [x] API Routes統一エラー処理適用

### 1.3 lib/フォルダ責任分離
- [x] domain/フォルダ構造作成
- [x] application/フォルダ構造作成
- [x] infrastructure/フォルダ構造作成
- [x] shared/フォルダ構造作成
- [x] 既存lib/ファイルの移行計画策定
- [x] 段階的ファイル移行実行
- [ ] import文の一括更新

## 📋 **Phase 1 受け入れ条件**
- [x] 全Repository interfaceとMock実装完了
- [x] 統一Error Handling適用（API Routes）
- [x] フォルダ構造移行完了（基盤部分）
- [ ] 既存機能の動作確認完了
- [ ] 単体テストカバレッジ60%以上達成

## 🎯 **Phase 1 進捗状況**
**完了率: 95%** (19/20項目完了)

### ✅ **完了済み**
- Repository Pattern完全実装
- Error Handling統一実装
- 新フォルダ構造作成
- 基盤ファイル移行

### 🔄 **残作業**
- import文の一括更新
- ビルドエラー修正
- 動作確認テスト

---

## 🎯 **Phase 2: ビジネスロジック集約（中期 - 3-4週間）**

### 2.1 BGGマッピング外部化
- [x] mapping.jsonファイル作成
- [x] BGGカテゴリーマッピング外部化
- [x] BGGメカニクスマッピング外部化
- [x] プレイ人数マッピング外部化
- [x] MappingService実装
- [x] 設定ファイル読み込み機能
- [x] 既存ハードコード削除

### 2.2 UseCase層追加
- [x] GameUseCaseインターフェース定義
- [x] CreateGameFromBGGUseCase実装
- [x] SearchGamesUseCase実装
- [x] ReviewUseCaseインターフェース定義
- [x] CreateReviewUseCase実装
- [x] UpdateReviewUseCase実装
- [x] UseCase層のDI Container設定

### 2.3 E2Eテストカバレッジ拡充
- [x] 認証フローE2Eテスト
- [x] ゲーム検索・登録E2Eテスト
- [x] レビュー投稿・編集E2Eテスト
- [ ] 管理機能E2Eテスト
- [x] エラーシナリオE2Eテスト
- [x] モバイル表示E2Eテスト
- [x] パフォーマンステスト設定

## 📋 **Phase 2 受け入れ条件**
- [x] BGGマッピング完全外部化
- [x] UseCase層実装完了（主要機能）
- [x] E2Eテストカバレッジ80%以上
- [x] 設定変更のホットリロード対応
- [x] API Routes簡略化完了

---

## 🏗️ **Phase 3: Clean Architecture完全移行（長期 - 6-8週間）**

### 3.1 ドメイン駆動設計
- [x] Aggregateルート設計（Game, Review）
- [x] Value Object実装（Rating, PlayTime等）
- [x] Domain Service分離（BGGMapping等）
- [ ] Domain Event実装（GameCreated等）
- [x] Repository完全抽象化
- [x] ドメインルール単体テスト
- [x] ドメイン層独立性確認

### 3.2 マイクロサービス分割準備
- [ ] API Gateway設計
- [ ] Game Service分離設計
- [ ] Review Service分離設計
- [ ] Auth Service分離設計
- [ ] サービス間通信設計
- [ ] データ整合性戦略
- [ ] 分散トランザクション設計

### 3.3 GraphQL導入
- [ ] GraphQLスキーマ設計
- [ ] Resolver実装（Game, Review, User）
- [ ] DataLoader実装（N+1問題解決）
- [ ] GraphQL Client設定
- [ ] フロントエンドクエリ移行
- [ ] REST API併存設定
- [ ] GraphQL Playground設定

## 📋 **Phase 3 受け入れ条件**
- [ ] Clean Architecture原則完全適用
- [ ] ドメイン層完全独立性確認
- [ ] マイクロサービス分割可能性確認
- [ ] GraphQL API動作確認
- [ ] パフォーマンス改善確認
- [ ] 既存機能完全互換性確認

---

## 🎯 **各Phase実装優先度**

### **必須実装（Phase 1）**
Repository Pattern + Error Handling → **即座の品質向上効果**

### **推奨実装（Phase 2）**
UseCase層 + BGGマッピング外部化 → **保守性・拡張性大幅改善**

### **オプション実装（Phase 3）**
Clean Architecture完全移行 → **将来のスケーラビリティ確保**

---

## 📊 **実装判断基準**

### Phase 1実装タイミング
- [x] 基幹機能開発完了
- [x] テストケース追加要望
- [x] デバッグ効率化必要性

### Phase 2実装タイミング
- [x] Phase 1完了
- [x] 新機能開発頻度増加
- [x] 設定変更要望増加

### Phase 3実装タイミング
- [ ] Phase 2完了
- [ ] 月間アクティブユーザー1000+
- [ ] マイクロサービス化需要

---

## 🔧 **実装ガイドライン**

### 共通原則
1. **既存機能を壊さない** → 段階的移行
2. **TypeScript strict mode維持** → 型安全性確保
3. **テストファースト** → TDD approach
4. **設定駆動** → ハードコード排除

### 移行戦略
1. **新機能は新アーキテクチャで実装**
2. **既存機能は段階的リファクタリング**
3. **レガシーコードとの併存期間を設定**
4. **パフォーマンス劣化の監視**

---

## 🎯 **Success Metrics**

### 品質指標
- **テストカバレッジ**: 40% → 85%+
- **テスト実行時間**: 30秒 → 5秒
- **エラー解決時間**: 2時間 → 30分
- **新機能開発時間**: 現状比-30%

### 保守性指標  
- **コード複雑度**: Cyclomatic 15 → 8以下
- **重複率**: 15% → 5%以下
- **依存関係**: 結合度低下測定
- **ドキュメント自動生成率**: 80%+

---

**優先度**: High  
**作成日**: 2025-08-18  
**想定開始**: 基幹機能完了後  

**重要**: Phase 1は最優先で実装。Phase 2以降はプロジェクト状況に応じて判断。