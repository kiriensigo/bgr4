-- モックボードゲームデータ挿入スクリプト

INSERT INTO games (
  bgg_id, name, japanese_name, description, 
  year_published, min_players, max_players, playing_time, min_age,
  image_url, thumbnail_url,
  mechanics, categories, designers, publishers,
  created_at, updated_at
) VALUES

-- 1. アズール（Azul）
(
  230802, 'Azul', 'アズール',
  '美しいタイルを使ったパズルゲーム。プレイヤーは宮殿の壁面を装飾するため、色とりどりのタイルを配置します。シンプルなルールながら戦略性の高いゲームです。',
  2017, 2, 4, 45, 8,
  'https://cf.geekdo-images.com/aPSHJO0d0XOpQR5X-wJonw__itemrep/img/q4cnj3cuPRE9HnJRNRGAHT5MSDk=/fit-in/246x300/filters:strip_icc()/pic6973671.png',
  'https://cf.geekdo-images.com/aPSHJO0d0XOpQR5X-wJonw__thumb/img/hnTcOgO4qHT-5W8w7rEfWWGPEh0=/fit-in/200x150/filters:strip_icc()/pic6973671.png',
  ARRAY['タイル配置', 'パターン構築', 'セット収集'],
  ARRAY['抽象戦略', 'ファミリー'],
  ARRAY['Michael Kiesling'],
  ARRAY['Plan B Games', 'ホビージャパン'],
  NOW(), NOW()
),

-- 2. カタン（Catan）
(
  13, 'Catan', 'カタンの開拓者たち',
  '無人島を舞台とした開拓ゲーム。資源を集めて道路や建物を建設し、島の支配権を争います。交渉と運の要素が絶妙にバランスした名作ゲームです。',
  1995, 3, 4, 75, 10,
  'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__itemrep/img/IzYEUm_gWFuRFOL8gQYqGm5gZg4=/fit-in/246x300/filters:strip_icc()/pic2419375.jpg',
  'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8A9Ygzgn6fZqZm63W8AaB-GaKjA=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg',
  ARRAY['ダイス', '交渉', '建設', 'エリア影響'],
  ARRAY['文明', 'ファミリー'],
  ARRAY['Klaus Teuber'],
  ARRAY['Catan Studio', 'ジーピー'],
  NOW(), NOW()
),

-- 3. ウイングスパン（Wingspan）
(
  266192, 'Wingspan', 'ウイングスパン',
  '美しい鳥をテーマにしたエンジン構築ゲーム。様々な鳥を自分の生息地に誘致し、強力なコンボを作り上げていきます。アートワークの美しさでも評価が高いゲームです。',
  2019, 1, 5, 75, 10,
  'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__itemrep/img/DR7181wU4lOTZ9u1AcgKl-d3-AY=/fit-in/246x300/filters:strip_icc()/pic4458123.jpg',
  'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/j_ixpzgpniBYlwNyJ6YW_X7OqWM=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg',
  ARRAY['エンジンビルディング', 'カードドラフト', 'セット収集'],
  ARRAY['動物', 'カードゲーム'],
  ARRAY['Elizabeth Hargrave'],
  ARRAY['Stonemaier Games', 'アークライト'],
  NOW(), NOW()
),

-- 4. スプレンダー（Splendor）
(
  148228, 'Splendor', 'スプレンダー',
  '宝石商となって財を築くカードゲーム。宝石を集めて鉱山や店舗、輸送手段を購入し、より多くの威信ポイントを獲得することを目指します。',
  2014, 2, 4, 30, 10,
  'https://cf.geekdo-images.com/rwOMxx4q5yuElIvo-1-OFw__itemrep/img/_p7O3LmOr4yQRFaL4gn9cr9Rhfc=/fit-in/246x300/filters:strip_icc()/pic1904079.jpg',
  'https://cf.geekdo-images.com/rwOMxx4q5yuElIvo-1-OFw__thumb/img/iqZWNguMWjfNY8SyGCx_kqDIE74=/fit-in/200x150/filters:strip_icc()/pic1904079.jpg',
  ARRAY['エンジンビルディング', 'セット収集', 'カード獲得'],
  ARRAY['ルネサンス', 'カードゲーム'],
  ARRAY['Marc André'],
  ARRAY['Space Cowboys', 'ホビージャパン'],
  NOW(), NOW()
),

-- 5. パンデミック（Pandemic）
(
  30549, 'Pandemic', 'パンデミック：新たなる試練',
  '協力ゲームの金字塔。プレイヤーは疫病と戦う専門家チームとなり、4つの病気の蔓延を食い止めて人類を救わなければなりません。全員で協力して勝利を目指します。',
  2008, 2, 4, 45, 8,
  'https://cf.geekdo-images.com/cTrAWasNHyKMcNs8Zrv5O7sKS6M=/fit-in/246x300/filters:strip_icc()/pic1534148.jpg',
  'https://cf.geekdo-images.com/cTrAWasNHyKMcNs8Zrv5O7sKS6M=/fit-in/200x150/filters:strip_icc()/pic1534148.jpg',
  ARRAY['協力', 'ハンドマネージメント', 'セットコレクション', 'ポイントトゥポイント移動'],
  ARRAY['医学', '協力', 'ファミリー'],
  ARRAY['Matt Leacock'],
  ARRAY['Z-Man Games', 'ホビージャパン'],
  NOW(), NOW()
),

-- 6. 7ワンダーズ（7 Wonders）
(
  68448, '7 Wonders', '世界の七不思議',
  '古代文明をテーマにしたドラフトゲーム。7つの偉大な都市の1つを担当し、3つの時代を通じて文明を発展させます。同時プレイで待ち時間が少ないのも魅力です。',
  2010, 2, 7, 30, 10,
  'https://cf.geekdo-images.com/RvFVTEpnbb4NM7k0IF8V7A__itemrep/img/F__zhk-OFDgFcMBysW2JlcYJADw=/fit-in/246x300/filters:strip_icc()/pic860217.jpg',
  'https://cf.geekdo-images.com/RvFVTEpnbb4NM7k0IF8V7A__thumb/img/loUpw3K7ARXzL0L8v5KfHrq_rDU=/fit-in/200x150/filters:strip_icc()/pic860217.jpg',
  ARRAY['カードドラフト', 'セットコレクション', '文明発展'],
  ARRAY['古代', '文明', 'カードゲーム'],
  ARRAY['Antoine Bauza'],
  ARRAY['Repos Production', 'ホビージャパン'],
  NOW(), NOW()
),

-- 7. キングオブトーキョー（King of Tokyo）
(
  70323, 'King of Tokyo', 'キング・オブ・トーキョー',
  '巨大怪獣となって東京を支配するダイスゲーム。攻撃、エネルギー、勝利ポイントを獲得して他の怪獣を倒すか、20点を先取した怪獣が勝利します。',
  2011, 2, 6, 45, 8,
  'https://cf.geekdo-images.com/kqOEGKKEloVpPLBaXKCjNA__itemrep/img/DulvGPFKQDPxhNYPIvHQmIJcG6k=/fit-in/246x300/filters:strip_icc()/pic3043734.jpg',
  'https://cf.geekdo-images.com/kqOEGKKEloVpPLBaXKCjNA__thumb/img/8kKSFYFG_o3vKc4xrMAabFHYR-k=/fit-in/200x150/filters:strip_icc()/pic3043734.jpg',
  ARRAY['ダイス', 'エリア影響', 'プレイヤー脱落'],
  ARRAY['格闘', 'ファミリー', 'パーティー'],
  ARRAY['Richard Garfield'],
  ARRAY['Iello', 'イエロー'],
  NOW(), NOW()
),

-- 8. チケット・トゥ・ライド（Ticket to Ride）
(
  9209, 'Ticket to Ride', 'チケット・トゥ・ライド',
  '鉄道をテーマにしたルート構築ゲーム。列車カードを集めて北アメリカ大陸に鉄道路線を敷設し、都市間をつないで得点を獲得します。シンプルで分かりやすいルールが魅力です。',
  2004, 2, 5, 60, 8,
  'https://cf.geekdo-images.com/ZnvyaJ_cLtTRaZmx8Qs8og__itemrep/img/RIB64Xk2nHqtBcBJI7hHIT3mYKk=/fit-in/246x300/filters:strip_icc()/pic38668.jpg',
  'https://cf.geekdo-images.com/ZnvyaJ_cLtTRaZmx8Qs8og__thumb/img/vbcdBBCa5eE-w6xT-vKYqHJGjM0=/fit-in/200x150/filters:strip_icc()/pic38668.jpg',
  ARRAY['ルート構築', 'セットコレクション', 'ハンドマネージメント'],
  ARRAY['鉄道', 'ファミリー'],
  ARRAY['Alan R. Moon'],
  ARRAY['Days of Wonder', 'ホビージャパン'],
  NOW(), NOW()
),

-- 9. コンコルディア（Concordia）
(
  124361, 'Concordia', 'コンコルディア',
  '古代ローマをテーマにした経済ゲーム。商人として地中海沿岸に交易路を築き、都市に入植して得点を獲得します。カードドリブンのシステムが秀逸な戦略ゲームです。',
  2013, 2, 5, 100, 13,
  'https://cf.geekdo-images.com/rF4WYNQEPGjO_5ZlBhbJNg__itemrep/img/TQiJNtYqFHqUa2W4w7P-OuFnFwQ=/fit-in/246x300/filters:strip_icc()/pic1825003.jpg',
  'https://cf.geekdo-images.com/rF4WYNQEPGjO_5ZlBhbJNg__thumb/img/Ml5cjJmR1Q1gKYovmYmI1Q5o8a8=/fit-in/200x150/filters:strip_icc()/pic1825003.jpg',
  ARRAY['ハンドマネージメント', 'エリア影響', 'ネットワーク構築'],
  ARRAY['古代', '経済', '地中海'],
  ARRAY['Mac Gerdts'],
  ARRAY['PD-Verlag', 'アークライト'],
  NOW(), NOW()
),

-- 10. テラフォーミング・マーズ（Terraforming Mars）
(
  167791, 'Terraforming Mars', 'テラフォーミング・マーズ',
  '火星をテラフォーミング（地球化）するゲーム。企業の一員として、火星の気温と酸素濃度を上げ、海洋率を高めて人類が住める惑星に改造していきます。',
  2016, 1, 5, 120, 12,
  'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__itemrep/img/BTJqkkVCCqiZKKdZCGU7-kTcLio=/fit-in/246x300/filters:strip_icc()/pic3536616.jpg',
  'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__thumb/img/b7ov2VIdvOi_StzSK7cQ_hWe1nk=/fit-in/200x150/filters:strip_icc()/pic3536616.jpg',
  ARRAY['カードドラフト', 'エンジンビルディング', 'ハンドマネージメント', 'タイル配置'],
  ARRAY['環境', '工業', 'SF', '領土', '宇宙探査'],
  ARRAY['Jacob Fryxelius'],
  ARRAY['FryxGames', 'アークライト'],
  NOW(), NOW()
);