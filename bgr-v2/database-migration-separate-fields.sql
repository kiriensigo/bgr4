-- BGG原データとサイト専用データを分離するマイグレーション
-- 2025-08-17: データフィールド分離

-- 新しいフィールドを追加
ALTER TABLE games ADD COLUMN IF NOT EXISTS bgg_categories text[];
ALTER TABLE games ADD COLUMN IF NOT EXISTS bgg_mechanics text[];
ALTER TABLE games ADD COLUMN IF NOT EXISTS bgg_publishers text[];
ALTER TABLE games ADD COLUMN IF NOT EXISTS site_categories text[];
ALTER TABLE games ADD COLUMN IF NOT EXISTS site_mechanics text[];
ALTER TABLE games ADD COLUMN IF NOT EXISTS site_publishers text[];

-- 既存データの移行
-- 現在のcategories/mechanicsをbgg_*に移動
UPDATE games SET 
  bgg_categories = categories,
  bgg_mechanics = mechanics,
  bgg_publishers = publishers
WHERE bgg_categories IS NULL;

-- 日本語データが既にある場合はsite_*に設定
UPDATE games SET 
  site_categories = CASE 
    WHEN array_to_string(categories, ' ') ~ '[ひらがなカタカナ漢字]' 
    THEN categories 
    ELSE ARRAY[]::text[] 
  END,
  site_mechanics = CASE 
    WHEN array_to_string(mechanics, ' ') ~ '[ひらがなカタカナ漢字]' 
    THEN mechanics 
    ELSE ARRAY[]::text[] 
  END,
  site_publishers = CASE 
    WHEN array_to_string(publishers, ' ') ~ '[ひらがなカタカナ漢字]' 
    THEN publishers 
    ELSE publishers -- パブリッシャーは元のまま保持
  END
WHERE site_categories IS NULL;

-- インデックスを追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_games_site_categories ON games USING GIN (site_categories);
CREATE INDEX IF NOT EXISTS idx_games_site_mechanics ON games USING GIN (site_mechanics);
CREATE INDEX IF NOT EXISTS idx_games_bgg_categories ON games USING GIN (bgg_categories);
CREATE INDEX IF NOT EXISTS idx_games_bgg_mechanics ON games USING GIN (bgg_mechanics);

-- コメント追加
COMMENT ON COLUMN games.bgg_categories IS 'BGG API原データ: カテゴリー（英語）';
COMMENT ON COLUMN games.bgg_mechanics IS 'BGG API原データ: メカニクス（英語）';
COMMENT ON COLUMN games.bgg_publishers IS 'BGG API原データ: パブリッシャー';
COMMENT ON COLUMN games.site_categories IS 'サイト専用データ: カテゴリー（日本語・厳選）';
COMMENT ON COLUMN games.site_mechanics IS 'サイト専用データ: メカニクス（日本語・厳選）';
COMMENT ON COLUMN games.site_publishers IS 'サイト専用データ: パブリッシャー（正規化済み）';