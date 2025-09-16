# BGR v2 アーキテクチャ設計書

## 📐 システムアーキテクチャ概要

BGRv2は**Clean Architecture**と**Domain Driven Design (DDD)**を基盤とした、スケーラブルで保守性の高いNext.js アプリケーションです。

### アーキテクチャ図

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                          │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Next.js 14 (App Router) + React Components     │ │
│  │ - pages/, components/, hooks/                   │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                Application Layer                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │ API Routes (app/api/) + UseCases + Services    │ │
│  │ - game-actions.ts, review-actions.ts           │ │
│  │ - GameUseCase, ReviewUseCase                    │ │
│  │ - DIContainer, ServiceRegistration             │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                  Domain Layer                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Entities, Value Objects, Domain Services       │ │
│  │ - Game, Review, User entities                   │ │
│  │ - PlayTime, Rating, Email value objects        │ │
│  │ - GameRepository, ReviewRepository interfaces  │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│               Infrastructure Layer                   │
│  ┌─────────────────────────────────────────────────┐ │
│  │ External Services & Data Access                 │ │
│  │ - SupabaseRepository implementations           │ │
│  │ - BGG API integration                           │ │
│  │ - External APIs, Database adapters             │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 🏗️ ディレクトリ構成

### `/src` 構造の詳細

```
src/
├── app/                        # Next.js App Router
│   ├── api/                    # API エンドポイント
│   │   ├── games/              # ゲーム関連API
│   │   ├── reviews/            # レビュー関連API
│   │   ├── admin/              # 管理機能API
│   │   └── auth/               # 認証API
│   ├── (auth)/                 # 認証ページ群
│   ├── games/                  # ゲーム関連ページ
│   ├── reviews/                # レビュー関連ページ
│   └── admin/                  # 管理機能ページ
│
├── domain/                     # ドメイン層
│   ├── entities/               # エンティティ
│   │   ├── Game.ts
│   │   ├── Review.ts
│   │   └── User.ts
│   ├── value-objects/          # 値オブジェクト
│   │   ├── PlayTime.ts
│   │   ├── Rating.ts
│   │   └── Email.ts
│   ├── repositories/           # リポジトリインターフェース
│   │   ├── GameRepository.ts
│   │   └── ReviewRepository.ts
│   ├── services/               # ドメインサービス
│   │   ├── GameValidationService.ts
│   │   └── MappingService.ts
│   └── errors/                 # ドメインエラー
│       └── DomainErrors.ts
│
├── application/                # アプリケーション層
│   ├── usecases/               # ユースケース
│   │   ├── GameUseCase.ts
│   │   └── ReviewUseCase.ts
│   ├── container/              # DI Container
│   │   ├── DIContainer.ts
│   │   └── ServiceRegistration.ts
│   └── services/               # アプリケーションサービス
│
├── infrastructure/             # インフラ層
│   ├── repositories/           # リポジトリ実装
│   │   ├── SupabaseGameRepository.ts
│   │   ├── SupabaseReviewRepository.ts
│   │   └── MockRepository classes (テスト用)
│   ├── config/                 # 設定・マッピング
│   │   ├── bgg-mappings.json
│   │   └── MappingConfigLoader.ts
│   └── services/               # 外部サービス連携
│       └── JapaneseGameIdService.ts
│
├── components/                 # UIコンポーネント
│   ├── games/                  # ゲーム関連コンポーネント
│   ├── reviews/                # レビュー関連コンポーネント
│   ├── admin/                  # 管理機能コンポーネント
│   └── ui/                     # 共通UIコンポーネント
│
├── hooks/                      # Reactカスタムフック
├── lib/                        # 共通ライブラリ
├── types/                      # 型定義
└── __tests__/                  # テスト
```

## 🔄 データフロー

### 1. ユーザーアクション → レスポンス の流れ

```
User Action (UI) 
    ↓
React Component (components/)
    ↓
Custom Hook (hooks/) 
    ↓
API Route (app/api/)
    ↓
UseCase (application/usecases/)
    ↓
Domain Service (domain/services/)
    ↓
Repository Interface (domain/repositories/)
    ↓
Repository Implementation (infrastructure/repositories/)
    ↓
External Service (Supabase/BGG API)
    ↓
Database/External API
```

### 2. 依存性の方向

```
UI Layer → Application Layer → Domain Layer ← Infrastructure Layer
```

- **UI Layer**: アプリケーション層に依存
- **Application Layer**: ドメイン層に依存
- **Infrastructure Layer**: ドメイン層のインターフェースを実装
- **Domain Layer**: 他のレイヤーに依存しない（独立性）

## 🛠️ 主要技術パターン

### Repository Pattern

```typescript
// Domain Layer - Interface
export interface GameRepository {
  findById(id: number): Promise<Game | null>
  save(game: Game): Promise<Game>
  findByBggId(bggId: string): Promise<Game | null>
}

// Infrastructure Layer - Implementation
export class SupabaseGameRepository implements GameRepository {
  async findById(id: number): Promise<Game | null> {
    // Supabase具体実装
  }
}
```

### UseCase Pattern

```typescript
export interface GameUseCase {
  createGameFromBGG(bggId: string): Promise<Game>
  searchGames(criteria: SearchCriteria): Promise<Game[]>
}

export class GameUseCaseImpl implements GameUseCase {
  constructor(
    private gameRepository: GameRepository,
    private mappingService: MappingService
  ) {}
  
  async createGameFromBGG(bggId: string): Promise<Game> {
    // ビジネスロジック実装
  }
}
```

### Dependency Injection

```typescript
// DIContainer.ts
export class DIContainer {
  static register(): void {
    // Repository registration
    container.bind<GameRepository>('GameRepository').to(SupabaseGameRepository)
    
    // UseCase registration
    container.bind<GameUseCase>('GameUseCase').to(GameUseCaseImpl)
  }
}
```

## 🔌 外部サービス統合

### BGG API統合

- **場所**: `infrastructure/services/`
- **機能**: BGGからのゲームデータ取得・変換
- **レート制限**: 1秒間隔での制御
- **データマッピング**: `infrastructure/config/bgg-mappings.json`

### Supabase統合

- **認証**: OAuth (Google/Twitter) + Row Level Security
- **データベース**: PostgreSQL with optimized schemas
- **リアルタイム**: レビュー・コメント機能

## 🧪 テスト戦略

### テストピラミッド

```
                    E2E Tests (Playwright)
                         △
                    Integration Tests
                       △   △
                Unit Tests (Jest)
              △   △   △   △   △
```

### テスト構成

- **Unit Tests**: `src/__tests__/` - 各レイヤー単位
- **Integration Tests**: APIエンドポイント統合テスト
- **E2E Tests**: `e2e/` - ユーザーシナリオテスト
- **Mock Repositories**: テスト用リポジトリ実装

## 📊 パフォーマンス考慮

### 最適化戦略

1. **データベース**: インデックス最適化・クエリチューニング
2. **キャッシュ**: SWR/React Query使用・API レスポンスキャッシュ
3. **画像**: Next.js Image最適化・WebP対応
4. **バンドル**: コード分割・Dynamic Import
5. **BGG API**: レート制限対応・データ更新差分検知

## 🔒 セキュリティ設計

### 認証・認可

- **認証**: Supabase Auth with OAuth providers
- **認可**: Row Level Security (RLS) policies  
- **セッション管理**: JWT + secure httpOnly cookies
- **CSRF保護**: Next.js built-in protection

### データ検証

- **入力検証**: Zod schema validation
- **型安全性**: TypeScript strict mode
- **SQLインジェクション**: Supabase query builder使用

## 🚀 デプロイメント

### 本番環境

- **Platform**: Netlify
- **CDN**: Netlify Edge Network
- **Database**: Supabase Cloud
- **Environment**: Node.js 18 LTS

### CI/CD Pipeline

- **リポジトリ**: GitHub
- **自動デプロイ**: Netlify GitHub連携
- **テスト実行**: GitHub Actions (将来実装)

---

**作成日**: 2025-08-30  
**対象バージョン**: BGR v2.0  
**レビュー周期**: 3ヶ月毎  
**メンテナンス**: プロジェクトチーム