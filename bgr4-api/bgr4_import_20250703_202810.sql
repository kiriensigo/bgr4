-- BGR4 データインポート用SQL
-- 生成日時: 2025-07-03 20:28:10
-- ソースファイル: tmp/games_export_20250703_195219.json
-- ゲーム数: 2


-- システムユーザー作成
INSERT INTO users (
    email, name, confirmed_at, created_at, updated_at, is_admin
) VALUES (
    'system@boardgamereviews.com',
    'BoardGameGeek',
    NOW(),
    NOW(),
    NOW(),
    FALSE
) ON CONFLICT (email) DO NOTHING;


