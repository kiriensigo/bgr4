-- プレイ時間範囲フィールドを追加するマイグレーション
-- 2025-08-22: min_playing_time, max_playing_time フィールド追加

-- 新しいプレイ時間範囲フィールドを追加
ALTER TABLE games ADD COLUMN IF NOT EXISTS min_playing_time integer;
ALTER TABLE games ADD COLUMN IF NOT EXISTS max_playing_time integer;

-- 既存データの移行: playing_time があるレコードはmin/maxに同じ値を設定
UPDATE games SET 
  min_playing_time = playing_time,
  max_playing_time = playing_time
WHERE playing_time IS NOT NULL 
  AND (min_playing_time IS NULL OR max_playing_time IS NULL);

-- インデックスを追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_games_min_playing_time ON games (min_playing_time);
CREATE INDEX IF NOT EXISTS idx_games_max_playing_time ON games (max_playing_time);

-- コメント追加
COMMENT ON COLUMN games.min_playing_time IS '最短プレイ時間（分）';
COMMENT ON COLUMN games.max_playing_time IS '最長プレイ時間（分）';
COMMENT ON COLUMN games.playing_time IS '通常プレイ時間（分）- 既存互換性用';