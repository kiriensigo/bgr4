-- Enhanced Review System Schema
-- 既存のreviewsテーブルに詳細評価項目を追加

-- 既存テーブルにカラムを追加
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rule_complexity INTEGER CHECK (rule_complexity >= 1 AND rule_complexity <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS luck_factor INTEGER CHECK (luck_factor >= 1 AND luck_factor <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS interaction INTEGER CHECK (interaction >= 1 AND interaction <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS downtime INTEGER CHECK (downtime >= 1 AND downtime <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS recommended_players TEXT[]; -- ["2", "3", "4"] 形式
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS mechanics TEXT[]; -- ["エリア支配", "ダイスロール"] 形式  
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS categories TEXT[]; -- ["協力", "推理"] 形式
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS custom_tags TEXT[]; -- ユーザー独自タグ
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS play_time_actual INTEGER; -- 実際のプレイ時間（分）
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS player_count_played INTEGER; -- 実際にプレイした人数

-- 既存のratingカラム名をoverall_scoreに変更（互換性のため残す）
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 10);

-- データ移行（既存のratingをoverall_scoreにコピー）
UPDATE reviews SET overall_score = rating WHERE overall_score IS NULL AND rating IS NOT NULL;

-- gamesテーブルの拡張（BGG APIデータ統合用）
ALTER TABLE games ADD COLUMN IF NOT EXISTS weight NUMERIC(3,2); -- BGG complexity weight
ALTER TABLE games ADD COLUMN IF NOT EXISTS bgg_rank INTEGER; -- BGG ranking
ALTER TABLE games ADD COLUMN IF NOT EXISTS min_age INTEGER; -- 最低年齢
ALTER TABLE games ADD COLUMN IF NOT EXISTS artists TEXT[]; -- アーティスト配列
ALTER TABLE games ADD COLUMN IF NOT EXISTS publishers TEXT[]; -- 出版社配列（複数対応）
ALTER TABLE games ADD COLUMN IF NOT EXISTS japanese_name TEXT; -- 日本語名
ALTER TABLE games ADD COLUMN IF NOT EXISTS japanese_publisher TEXT; -- 日本語版出版社
ALTER TABLE games ADD COLUMN IF NOT EXISTS japanese_image_url TEXT; -- 日本語版画像URL
ALTER TABLE games ADD COLUMN IF NOT EXISTS bgg_best_players TEXT[]; -- BGG推奨プレイ人数
ALTER TABLE games ADD COLUMN IF NOT EXISTS bgg_recommended_players TEXT[]; -- BGG推奨プレイ人数
ALTER TABLE games ADD COLUMN IF NOT EXISTS min_play_time INTEGER; -- 最小プレイ時間
ALTER TABLE games ADD COLUMN IF NOT EXISTS max_play_time INTEGER; -- 最大プレイ時間

-- 評価項目の集計用テーブル（ゲーム毎の平均値）
CREATE TABLE IF NOT EXISTS game_statistics (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    
    -- 平均評価
    avg_overall_score NUMERIC(3,2),
    avg_rule_complexity NUMERIC(3,2), 
    avg_luck_factor NUMERIC(3,2),
    avg_interaction NUMERIC(3,2),
    avg_downtime NUMERIC(3,2),
    
    -- 評価数
    review_count INTEGER DEFAULT 0,
    
    -- 推奨プレイ人数の集計（各人数での推奨度%）
    recommended_2p_percent INTEGER DEFAULT 0,
    recommended_3p_percent INTEGER DEFAULT 0,
    recommended_4p_percent INTEGER DEFAULT 0,
    recommended_5p_percent INTEGER DEFAULT 0,
    recommended_6p_percent INTEGER DEFAULT 0,
    recommended_7p_percent INTEGER DEFAULT 0,
    
    -- 人気メカニクス・カテゴリー（上位5つ）
    popular_mechanics JSONB,
    popular_categories JSONB,
    
    -- 統計更新日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(game_id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_reviews_overall_score ON reviews(overall_score);
CREATE INDEX IF NOT EXISTS idx_reviews_rule_complexity ON reviews(rule_complexity);
CREATE INDEX IF NOT EXISTS idx_reviews_luck_factor ON reviews(luck_factor);
CREATE INDEX IF NOT EXISTS idx_reviews_interaction ON reviews(interaction);
CREATE INDEX IF NOT EXISTS idx_reviews_downtime ON reviews(downtime);
CREATE INDEX IF NOT EXISTS idx_reviews_mechanics ON reviews USING GIN(mechanics);
CREATE INDEX IF NOT EXISTS idx_reviews_categories ON reviews USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_reviews_recommended_players ON reviews USING GIN(recommended_players);

CREATE INDEX IF NOT EXISTS idx_games_weight ON games(weight);
CREATE INDEX IF NOT EXISTS idx_games_bgg_rank ON games(bgg_rank);
CREATE INDEX IF NOT EXISTS idx_games_japanese_publisher ON games(japanese_publisher);
CREATE INDEX IF NOT EXISTS idx_games_mechanics ON games USING GIN(mechanics);
CREATE INDEX IF NOT EXISTS idx_games_categories ON games USING GIN(categories);

CREATE INDEX IF NOT EXISTS idx_game_statistics_game_id ON game_statistics(game_id);
CREATE INDEX IF NOT EXISTS idx_game_statistics_avg_overall_score ON game_statistics(avg_overall_score);

-- 統計更新用のファンクション
CREATE OR REPLACE FUNCTION update_game_statistics(p_game_id BIGINT) 
RETURNS VOID AS $$
BEGIN
    INSERT INTO game_statistics (
        game_id,
        avg_overall_score,
        avg_rule_complexity,
        avg_luck_factor,
        avg_interaction,
        avg_downtime,
        review_count,
        recommended_2p_percent,
        recommended_3p_percent, 
        recommended_4p_percent,
        recommended_5p_percent,
        recommended_6p_percent,
        recommended_7p_percent,
        popular_mechanics,
        popular_categories,
        updated_at
    )
    SELECT 
        p_game_id,
        ROUND(AVG(overall_score), 2),
        ROUND(AVG(rule_complexity), 2),
        ROUND(AVG(luck_factor), 2),
        ROUND(AVG(interaction), 2),
        ROUND(AVG(downtime), 2),
        COUNT(*),
        -- 推奨プレイ人数の割合計算
        ROUND(COUNT(*) FILTER (WHERE '2' = ANY(recommended_players)) * 100.0 / COUNT(*)),
        ROUND(COUNT(*) FILTER (WHERE '3' = ANY(recommended_players)) * 100.0 / COUNT(*)),
        ROUND(COUNT(*) FILTER (WHERE '4' = ANY(recommended_players)) * 100.0 / COUNT(*)),
        ROUND(COUNT(*) FILTER (WHERE '5' = ANY(recommended_players)) * 100.0 / COUNT(*)),
        ROUND(COUNT(*) FILTER (WHERE '6' = ANY(recommended_players)) * 100.0 / COUNT(*)),
        ROUND(COUNT(*) FILTER (WHERE '7' = ANY(recommended_players)) * 100.0 / COUNT(*)),
        -- 人気メカニクスTop5をJSONBで保存
        (
            SELECT jsonb_agg(
                jsonb_build_object('name', mechanic, 'count', cnt)
                ORDER BY cnt DESC
            )
            FROM (
                SELECT mechanic, COUNT(*) as cnt
                FROM reviews r, UNNEST(r.mechanics) as mechanic
                WHERE r.game_id = p_game_id AND r.is_published = true
                GROUP BY mechanic
                ORDER BY cnt DESC
                LIMIT 5
            ) AS top_mechanics
        ),
        -- 人気カテゴリーTop5をJSONBで保存
        (
            SELECT jsonb_agg(
                jsonb_build_object('name', category, 'count', cnt)
                ORDER BY cnt DESC
            )
            FROM (
                SELECT category, COUNT(*) as cnt
                FROM reviews r, UNNEST(r.categories) as category
                WHERE r.game_id = p_game_id AND r.is_published = true
                GROUP BY category
                ORDER BY cnt DESC
                LIMIT 5
            ) AS top_categories
        ),
        NOW()
    FROM reviews 
    WHERE game_id = p_game_id AND is_published = true
    ON CONFLICT (game_id) 
    DO UPDATE SET
        avg_overall_score = EXCLUDED.avg_overall_score,
        avg_rule_complexity = EXCLUDED.avg_rule_complexity,
        avg_luck_factor = EXCLUDED.avg_luck_factor,
        avg_interaction = EXCLUDED.avg_interaction,
        avg_downtime = EXCLUDED.avg_downtime,
        review_count = EXCLUDED.review_count,
        recommended_2p_percent = EXCLUDED.recommended_2p_percent,
        recommended_3p_percent = EXCLUDED.recommended_3p_percent,
        recommended_4p_percent = EXCLUDED.recommended_4p_percent,
        recommended_5p_percent = EXCLUDED.recommended_5p_percent,
        recommended_6p_percent = EXCLUDED.recommended_6p_percent,
        recommended_7p_percent = EXCLUDED.recommended_7p_percent,
        popular_mechanics = EXCLUDED.popular_mechanics,
        popular_categories = EXCLUDED.popular_categories,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- サンプルデータで既存ゲームの詳細評価を追加
UPDATE games 
SET 
    weight = CASE 
        WHEN id = 1 THEN 2.8
        WHEN id = 2 THEN 2.3
        WHEN id = 3 THEN 2.9
        ELSE weight
    END,
    min_age = CASE 
        WHEN id = 1 THEN 10
        WHEN id = 2 THEN 8
        WHEN id = 3 THEN 10
        ELSE min_age
    END,
    japanese_name = CASE 
        WHEN id = 1 THEN 'カタン'
        WHEN id = 2 THEN 'アズール'
        WHEN id = 3 THEN 'ウイングスパン'
        ELSE japanese_name
    END,
    japanese_publisher = CASE 
        WHEN id = 1 THEN 'ジーピー'
        WHEN id = 2 THEN 'ホビージャパン'
        WHEN id = 3 THEN 'アークライト'
        ELSE japanese_publisher
    END;

-- 既存レビューに詳細評価のサンプルデータを追加
UPDATE reviews 
SET 
    rule_complexity = CASE 
        WHEN game_id = 1 THEN 3
        WHEN game_id = 2 THEN 2  
        WHEN game_id = 3 THEN 3
        ELSE 3
    END,
    luck_factor = CASE 
        WHEN game_id = 1 THEN 4
        WHEN game_id = 2 THEN 2
        WHEN game_id = 3 THEN 3
        ELSE 3
    END,
    interaction = CASE 
        WHEN game_id = 1 THEN 4
        WHEN game_id = 2 THEN 3
        WHEN game_id = 3 THEN 2
        ELSE 3
    END,
    downtime = CASE 
        WHEN game_id = 1 THEN 3
        WHEN game_id = 2 THEN 2
        WHEN game_id = 3 THEN 2  
        ELSE 3
    END,
    recommended_players = CASE 
        WHEN game_id = 1 THEN ARRAY['3', '4']
        WHEN game_id = 2 THEN ARRAY['2', '3', '4']
        WHEN game_id = 3 THEN ARRAY['2', '3', '4', '5']
        ELSE ARRAY['2', '3', '4']
    END,
    mechanics = CASE 
        WHEN game_id = 1 THEN ARRAY['ダイスロール', 'ルート構築', 'タイル配置']
        WHEN game_id = 2 THEN ARRAY['タイル配置', 'パターン構築', 'セット収集']
        WHEN game_id = 3 THEN ARRAY['エンジンビルド', 'カードドラフト', 'セット収集']
        ELSE ARRAY['タイル配置']
    END,
    categories = CASE 
        WHEN game_id = 1 THEN ARRAY['ファミリー', '戦略']
        WHEN game_id = 2 THEN ARRAY['抽象戦略', 'ファミリー']
        WHEN game_id = 3 THEN ARRAY['動物', '戦略']
        ELSE ARRAY['ファミリー']
    END,
    overall_score = COALESCE(overall_score, rating);

COMMIT;