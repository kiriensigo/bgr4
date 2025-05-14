-- データベースの作成（存在しない場合）
CREATE DATABASE IF NOT EXISTS bgr4_production;

-- ゲームテーブル
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER,
  description TEXT,
  mechanics TEXT[],
  categories TEXT[],
  designer VARCHAR(255),
  publisher VARCHAR(255),
  year_published INTEGER,
  complexity DECIMAL(3, 1),
  bgg_rating DECIMAL(3, 1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- レビューテーブル
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  rating DECIMAL(2, 1) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
);

-- サンプルデータの挿入
INSERT INTO games (
  name, image_url, min_players, max_players, playing_time, 
  description, mechanics, categories, designer, publisher, 
  year_published, complexity, bgg_rating
) VALUES 
(
  'カタン', 
  'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__imagepage/img/M_3Vg1j2HlNgkv7PL2xl2BJE2bw=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2419375.jpg',
  3, 4, 60,
  '資源を集めて道や都市を作り、勝利点を競うゲーム。プレイヤーは開拓者となり、カタン島に入植します。サイコロの目に応じて資源カードを集め、道や集落、都市を建設していきます。交易も重要な要素で、他プレイヤーと資源を交換することができます。最初に勝利点10点を獲得したプレイヤーが勝利します。',
  ARRAY['サイコロ', '資源管理', '交渉', '道の建設'],
  ARRAY['戦略', '交渉', '文明'],
  'クラウス・トイバー',
  'コスモス',
  1995, 2.3, 7.1
),
(
  'ドミニオン',
  'https://cf.geekdo-images.com/j6iQpZ4XkemZP07HNCODBA__imagepage/img/_tNxKUkYOIWHGCPJuefIh-B1CSc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic394356.jpg',
  2, 4, 30,
  'デッキ構築型のカードゲーム。プレイヤーは小さな王国の君主となり、自分の領土を拡大していきます。ゲーム開始時は基本的なカードのみを持っていますが、ゲーム中に様々なカードを購入してデッキを強化していきます。ゲーム終了時に最も多くの勝利点を獲得したプレイヤーが勝利します。',
  ARRAY['デッキ構築', 'ハンド管理', 'カード獲得'],
  ARRAY['戦略', 'カードゲーム'],
  'ドナルド・X・ヴァッカリーノ',
  'Rio Grande Games',
  2008, 2.4, 7.6
),
(
  'パンデミック',
  'https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__imagepage/img/kIBu36OGgj4YZQBBjQoeWJccfQA=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1534148.jpg',
  2, 4, 45,
  '協力型のボードゲーム。世界的な感染症の拡大を防ぐために、プレイヤーは様々な役割（科学者、研究者、衛生兵など）を担当し、チームとして協力します。感染を抑えながら、4種類の病気の治療法を発見することが目標です。時間との戦いでもあり、感染カードのデッキがなくなるか、アウトブレイクが多発すると全員の敗北となります。',
  ARRAY['協力プレイ', 'ハンド管理', 'ポイント・トゥ・ポイント移動', '役割の割り当て'],
  ARRAY['医学', '協力', '現代'],
  'マット・リーコック',
  'Z-Man Games',
  2008, 2.4, 7.6
);

-- サンプルレビューデータの挿入
INSERT INTO reviews (game_id, user_name, rating, comment) VALUES 
(1, 'ボードゲーム愛好家', 4.5, '定番中の定番ゲーム。何度やっても楽しい！初心者にもおすすめです。'),
(1, 'ゲーマー太郎', 4.0, '交渉要素が面白い。ただ運の要素も強いので、その点は好みが分かれるかも。'),
(2, 'カードゲームマニア', 5.0, 'デッキ構築ゲームの金字塔。拡張も含めると組み合わせは無限大！'),
(3, '協力プレイ好き', 4.5, '協力ゲームとしては最高峰の一つ。難易度調整もできるので長く遊べます。'); 