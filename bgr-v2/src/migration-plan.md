# lib/フォルダ移行計画

## 現在のlib/ファイル分類

### Domain層に移行
- `validations.ts` → `domain/validations/`
- `game-constants.ts` → `shared/constants/`

### Infrastructure層に移行  
- `supabase-client.ts` → `infrastructure/config/`
- `supabase-server.ts` → `infrastructure/config/`
- `supabase.ts` → `infrastructure/config/`
- `db.ts` → `infrastructure/config/`
- `bgg-api.ts` → `infrastructure/external/`
- `cache.ts` → `infrastructure/config/`
- `simple-rate-limit.ts` → `infrastructure/external/`

### Application層に移行
- `admin.ts` → `application/services/`
- `auth.ts` → `application/services/`
- `auth-recovery.ts` → `application/services/`

### Shared層に移行
- `utils.ts` → `shared/utils/`
- `text-utils.ts` → `shared/utils/`
- `api-config.ts` → `shared/constants/`
- `game-display-utils.ts` → `shared/utils/`
- `display-mapping.ts` → `shared/utils/`

### Domain Services層に移行
- `bgg-mapping.ts` → `domain/services/`
- `bgg-mapping.js` → `domain/services/` (統合)
- `bgg.ts` → `domain/services/`

## 移行優先順位

### Phase 1: 基盤ファイル移行
1. `utils.ts` → `shared/utils/`
2. `game-constants.ts` → `shared/constants/`
3. `api-config.ts` → `shared/constants/`

### Phase 2: Infrastructure移行
1. `supabase-*.ts` → `infrastructure/config/`
2. `bgg-api.ts` → `infrastructure/external/`
3. `cache.ts`, `simple-rate-limit.ts` → `infrastructure/`

### Phase 3: Domain/Application移行
1. `validations.ts` → `domain/validations/`
2. `bgg-mapping.ts` → `domain/services/`
3. `admin.ts`, `auth.ts` → `application/services/`

## 注意事項
- import文の依存関係を慎重に確認
- 既存のテストファイルのimport更新
- 段階的移行でビルドエラーを回避