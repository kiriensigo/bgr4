-- PostgreSQLのgamesテーブルのシーケンスを修正
-- 既存の最大IDより大きい値にシーケンスをリセット

-- 現在の最大IDを確認
SELECT MAX(id) FROM games;

-- シーケンスを最大ID+1にリセット
SELECT setval('games_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM games), false);

-- シーケンスの現在値を確認
SELECT currval('games_id_seq');
SELECT nextval('games_id_seq'); 