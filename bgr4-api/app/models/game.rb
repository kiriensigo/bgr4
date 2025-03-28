class Game < ApplicationRecord
  has_many :reviews, primary_key: :bgg_id, foreign_key: :game_id
  has_many :users, through: :reviews
  has_many :game_edit_histories
  # wishlist_itemsはgameカラムにbgg_idを持つ
  # has_many :wishlist_items, primary_key: :bgg_id, foreign_key: :game

  validates :name, presence: true
  validates :bgg_id, presence: true, uniqueness: true
  validates :min_players, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :max_players, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :play_time, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :average_score, numericality: {
    greater_than_or_equal_to: 0,
    less_than_or_equal_to: 10,
    allow_nil: true
  }

  # 拡張情報とベースゲーム情報を保存するためのJSONカラム
  store :metadata, accessors: [:expansions, :best_num_players, :recommended_num_players, :categories, :mechanics], coder: JSON

  # metadataの特定のキーに値を保存するメソッド
  def store_metadata(key, value)
    metadata_will_change!
    self.metadata ||= {}
    self.metadata[key.to_s] = value
  end

  # ゲーム作成後に初期レビューを作成するコールバック
  after_create :create_initial_reviews

  # サイトに登録されているゲームのスコープ
  scope :registered, -> { where(registered_on_site: true) }
  
  # BGGからゲーム情報を更新
  def update_from_bgg(force_update = false)
    # 特定のゲーム（カスカディア）の場合は特別な処理
    if bgg_id == '314343'
      self.publisher = 'Alderac Entertainment Group'
      self.japanese_publisher = '株式会社ケンビル'
      self.japanese_name = 'カスカディア' if japanese_name.blank? || force_update
      self.japanese_release_date = '2022-01-01' if japanese_release_date.blank? || force_update
      save!
      
      return true
    end
    
    # BGGからゲーム情報を取得
    bgg_game_info = BggService.get_game_details(bgg_id)
    return false unless bgg_game_info.present?
    
    # 基本情報を更新
    self.name = bgg_game_info[:name] if name.blank? || force_update
    self.description = bgg_game_info[:description] if description.blank? || force_update
    self.image_url = bgg_game_info[:image_url] if image_url.blank? || force_update
    self.min_players = bgg_game_info[:min_players] if min_players.blank? || force_update
    self.max_players = bgg_game_info[:max_players] if max_players.blank? || force_update
    self.play_time = bgg_game_info[:play_time] if play_time.blank? || force_update
    self.min_play_time = bgg_game_info[:min_play_time] if min_play_time.blank? || force_update
    self.average_score = bgg_game_info[:average_score] if average_score.blank? || force_update
    self.weight = bgg_game_info[:weight] if weight.blank? || force_update
    self.publisher = bgg_game_info[:publisher] if publisher.blank? || force_update
    self.designer = bgg_game_info[:designer] if designer.blank? || force_update
    self.release_date = bgg_game_info[:release_date] if release_date.blank? || force_update
    
    # JapanesePublisherモデルから日本語出版社情報を取得
    japanese_publisher_from_db = JapanesePublisher.get_publisher_name(bgg_id)
    if japanese_publisher_from_db.present?
      self.japanese_publisher = japanese_publisher_from_db
      Rails.logger.info "Using Japanese publisher from database: #{japanese_publisher_from_db}"
    end
    
    # 日本語版情報を取得
    japanese_version = BggService.get_japanese_version_info(bgg_id)
    
    if japanese_version
      # 日本語版情報を更新
      if japanese_version[:name].present? && (force_update || !has_japanese_name?)
        self.japanese_name = japanese_version[:name]
      end
      
      # 日本語出版社情報がデータベースから取得できなかった場合のみAPIの情報を使用
      if japanese_publisher_from_db.blank? && japanese_version[:publisher].present? && (force_update || !has_japanese_publisher?)
        self.japanese_publisher = japanese_version[:publisher]
      end
      
      if japanese_version[:release_date].present? && (force_update || !has_japanese_release_date?)
        self.japanese_release_date = japanese_version[:release_date]
      end
      
      if japanese_version[:image_url].present? && (japanese_image_url.blank? || force_update)
        self.japanese_image_url = japanese_version[:image_url]
      end
    else
      # BGGから直接取得した日本語情報を使用（get_japanese_version_infoで見つからなかった場合）
      if bgg_game_info[:japanese_name].present? && (force_update || !has_japanese_name?)
        self.japanese_name = bgg_game_info[:japanese_name]
      end
      
      # 日本語出版社情報がデータベースから取得できなかった場合のみAPIの情報を使用
      if japanese_publisher_from_db.blank? && bgg_game_info[:japanese_publisher].present? && (force_update || !has_japanese_publisher?)
        self.japanese_publisher = bgg_game_info[:japanese_publisher]
      end
      
      if bgg_game_info[:japanese_release_date].present? && (force_update || !has_japanese_release_date?)
        self.japanese_release_date = bgg_game_info[:japanese_release_date]
      end
      
      if bgg_game_info[:japanese_image_url].present? && (japanese_image_url.blank? || force_update)
        self.japanese_image_url = bgg_game_info[:japanese_image_url]
      end
    end
    
    # 日本語出版社名を正規化
    normalize_japanese_publisher
    
    # メタデータを更新
    if bgg_game_info[:expansions].present?
      store_metadata(:expansions, bgg_game_info[:expansions])
    end
    
    if bgg_game_info[:best_num_players].present?
      store_metadata(:best_num_players, bgg_game_info[:best_num_players])
    end
    
    if bgg_game_info[:recommended_num_players].present?
      store_metadata(:recommended_num_players, bgg_game_info[:recommended_num_players])
    end
    
    if bgg_game_info[:categories].present?
      store_metadata(:categories, bgg_game_info[:categories])
    end
    
    if bgg_game_info[:mechanics].present?
      store_metadata(:mechanics, bgg_game_info[:mechanics])
    end
    
    save!
    
    true
  end

  def bgg_id
    self[:bgg_id] || id.to_s
  end

  def bgg_url
    "https://boardgamegeek.com/boardgame/#{bgg_id}" if bgg_id.present?
  end
  
  # このゲームに関連するウィッシュリストアイテムを取得
  def wishlist_items
    WishlistItem.where(game: bgg_id)
  end

  # BGGのURLをJSONレスポンスに含める
  def as_json(options = {})
    super(options).tap do |json|
      json['bgg_id'] = bgg_id
      json['bgg_url'] = bgg_url
      json['publisher'] = publisher
      json['designer'] = designer
      json['release_date'] = release_date
      json['japanese_release_date'] = japanese_release_date
      json['expansions'] = expansions
      json['best_num_players'] = best_num_players
      json['recommended_num_players'] = recommended_num_players
      json['categories'] = categories
      json['mechanics'] = mechanics
    end
  end

  # 日本語名が設定されているかどうか
  def has_japanese_name?
    japanese_name.present?
  end

  # 日本語の出版社が設定されているかどうか
  def has_japanese_publisher?
    japanese_publisher.present?
  end

  # 日本語の発売日が設定されているかどうか
  def has_japanese_release_date?
    japanese_release_date.present?
  end

  # 日本語情報が何か設定されているかどうか
  def has_japanese_info?
    has_japanese_name? || has_japanese_publisher? || has_japanese_release_date?
  end

  # 発売年を取得
  def release_year
    release_date&.year
  end

  # 日本語版の発売年を取得
  def japanese_release_year
    japanese_release_date&.year
  end

  # 日本語版の画像URLを取得（ない場合は通常の画像URL）
  def japanese_image_url
    self[:japanese_image_url].presence || image_url
  end

  # プレイ時間の表示形式を取得
  def formatted_play_time
    if min_play_time.present? && play_time.present? && min_play_time != play_time
      "#{min_play_time}〜#{play_time}分"
    elsif play_time.present?
      "#{play_time}分"
    else
      nil
    end
  end

  # 表示用の名前を取得（日本語名があればそれを使用）
  def display_name
    japanese_name.presence || name
  end

  # 表示用の説明を取得（日本語説明があればそれを使用）
  def display_description
    japanese_description.presence || description
  end

  # 表示用の画像URLを取得（日本語版の画像があればそれを使用）
  def display_image_url
    japanese_image_url.presence || image_url
  end

  # 平均ルールの複雑さを計算
  def average_rule_complexity
    reviews.average(:rule_complexity)&.round(1) || 0
  end

  # 平均運要素を計算（システムユーザーを除外）
  def average_luck_factor
    reviews.exclude_system_user.average(:luck_factor)&.round(1) || 0
  end

  # 平均インタラクションを計算（システムユーザーを除外）
  def average_interaction
    reviews.exclude_system_user.average(:interaction)&.round(1) || 0
  end

  # 平均ダウンタイムを計算（システムユーザーを除外）
  def average_downtime
    reviews.exclude_system_user.average(:downtime)&.round(1) || 0
  end

  # システムユーザーのレビューを含めた平均運要素を計算
  def average_luck_factor_with_system
    reviews.average(:luck_factor)&.round(1) || 0
  end

  # システムユーザーのレビューを含めた平均インタラクションを計算
  def average_interaction_with_system
    reviews.average(:interaction)&.round(1) || 0
  end

  # システムユーザーのレビューを含めた平均ダウンタイムを計算
  def average_downtime_with_system
    reviews.average(:downtime)&.round(1) || 0
  end

  # 平均総合評価を計算
  def average_overall_score
    reviews.average(:overall_score)&.round(1) || 0
  end

  # 平均値をデータベースに保存
  def update_average_values
    # 平均値を計算
    avg_complexity = average_rule_complexity
    avg_interaction = average_interaction
    avg_downtime = average_downtime
    avg_luck_factor = reviews.exclude_system_user.average(:luck_factor)&.round(1) || 0
    avg_score = average_overall_score
    
    # データベースに保存
    update_columns(
      average_complexity: avg_complexity,
      average_interaction: avg_interaction,
      average_downtime: avg_downtime,
      average_luck_factor: avg_luck_factor,
      average_score: avg_score
    )
  end

  # レビュー数を取得
  def review_count
    reviews.count
  end

  # レビュー数を取得（システムユーザーを除く）
  def user_review_count
    reviews.exclude_system_user.count
  end
  
  # reviews_count属性のエイリアス
  def reviews_count
    user_review_count
  end
  
  # ゲームがウィッシュリストに入っているかどうかを返す
  # 注: このメソッドはシリアライザーで使用されるため、スコープからユーザーを取得する必要があります
  def in_wishlist
    # モデルからは直接スコープにアクセスできないため、常にfalseを返す
    # 実際の実装はGameSerializerクラスで行う
    false
  end
  
  # プレイヤー数のカウントを集計するヘルパーメソッド
  def count_player_recommendations(reviews_scope)
    player_counts = {}
    
    reviews_scope.each do |review|
      (review.recommended_players || []).each do |count|
        next unless count.present?
        player_counts[count] = (player_counts[count] || 0) + 1
      end
    end
    
    # 出現回数でソート
    player_counts.sort_by { |_, count| -count }.map { |count, votes| { count: count, votes: votes } }
  end
  
  # おすすめプレイ人数を取得（すべてのレビュー）
  def recommended_players
    count_player_recommendations(reviews)
  end

  # サイトのおすすめプレイ人数を取得（システムユーザーのレビューを除外）
  def site_recommended_players
    count_player_recommendations(reviews.exclude_system_user)
  end
  
  # 出版社名を日本語化
  def normalize_japanese_publisher
    return unless japanese_publisher.present?
    
    # JapanesePublisherモデルから出版社情報を取得
    japanese_publisher_from_db = JapanesePublisher.get_publisher_name(bgg_id)
    if japanese_publisher_from_db.present?
      # データベースの情報を優先
      if japanese_publisher != japanese_publisher_from_db
        self.japanese_publisher = japanese_publisher_from_db
        Rails.logger.info "Normalized Japanese publisher from database: #{japanese_publisher_from_db}"
      end
      return
    end
    
    # 日本の出版社リストと正規化マッピング
    japanese_publisher_mapping = {
      # ホビージャパン系
      'hobby japan' => 'ホビージャパン',
      'hobbyjapan' => 'ホビージャパン',
      'hobby-japan' => 'ホビージャパン',
      
      # アークライト系
      'arclight' => 'アークライト',
      'arclightgames' => 'アークライト',
      'arc light' => 'アークライト',
      
      # その他の日本の出版社
      'グループSNE' => 'グループSNE',
      'groupsne' => 'グループSNE',
      'group sne' => 'グループSNE',
      
      'カナイ製作所' => 'カナイ製作所',
      'kanai' => 'カナイ製作所',
      'カナイファクトリー' => 'カナイ製作所',
      
      'ニューゲームズオーダー' => 'ニューゲームズオーダー',
      'new games order' => 'ニューゲームズオーダー',
      'ngo' => 'ニューゲームズオーダー',
      
      'コロンアーク' => 'コロンアーク',
      'colon arc' => 'コロンアーク',
      
      '数寄ゲームズ' => '数寄ゲームズ',
      'suki games' => '数寄ゲームズ',
      
      'ダイスタワー' => 'ダイスタワー',
      'dice tower' => 'ダイスタワー',
      
      'ボードゲームジャパン' => 'ボードゲームジャパン',
      'board game japan' => 'ボードゲームジャパン',
      'bgj' => 'ボードゲームジャパン',
      
      'ゲームマーケット' => 'ゲームマーケット',
      'game market' => 'ゲームマーケット',
      
      'ジーピー' => 'ジーピー',
      'gp' => 'ジーピー',
      
      'ハコニワ' => 'ハコニワ',
      'hakoniwagames' => 'ハコニワ',
      
      'テンデイズゲームズ' => 'テンデイズゲームズ',
      'ten days games' => 'テンデイズゲームズ',
      'tendaysgames' => 'テンデイズゲームズ',
      
      'グラウンディング' => 'グラウンディング',
      'grounding inc.' => 'グラウンディング',
      'grounding' => 'グラウンディング',
      
      'オインクゲームズ' => 'オインクゲームズ',
      'oink games' => 'オインクゲームズ',
      
      'アズモデージャパン' => 'アズモデージャパン',
      'asmodee japan' => 'アズモデージャパン',
      'asmodee' => 'アズモデージャパン',
      
      '株式会社ケンビル' => '株式会社ケンビル',
      'kenbill' => '株式会社ケンビル',
      'alderac entertainment group' => '株式会社ケンビル',
      'aeg' => '株式会社ケンビル',
      'flatout games' => '株式会社ケンビル'
    }
    
    # 表記揺れを修正して正規化
    normalized_name = nil
    japanese_publisher_mapping.each do |key, value|
      if japanese_publisher.downcase.include?(key.downcase)
        normalized_name = value
        break
      end
    end
    
    # 正規化された名前が見つかり、現在の値と異なる場合は更新
    if normalized_name.present? && normalized_name != japanese_publisher
      self.japanese_publisher = normalized_name
      Rails.logger.info "Normalized Japanese publisher from mapping: #{japanese_publisher} (from #{japanese_publisher_before_last_save})"
    end
  end
  
  # ゲーム登録時に初期レビューを作成する
  def create_initial_reviews(manual_registration = false)
    # システムユーザーを取得
    system_user = User.find_by(email: 'system@boardgamereview.com')
    return unless system_user
    
    # 手動登録の場合は、特別なルールでレビューを作成
    if manual_registration
      # 固定値の設定
      overall_score = 7.0
      
      # 5件のレビューを作成
      5.times do |i|
        # おすすめプレイ人数を設定（最初の2件のみ1〜7を選択、残りは空）
        recommended_players = []
        if i < 2
          # 1〜7のすべてのプレイ人数を選択
          recommended_players = ["1", "2", "3", "4", "5", "6", "7"]
        end
        
        Review.create(
          user_id: system_user.id,
          game_id: bgg_id,
          overall_score: overall_score,
          rule_complexity: nil,
          luck_factor: nil,
          interaction: nil,
          downtime: nil,
          recommended_players: recommended_players,
          short_comment: nil
        )
      end
      
      Rails.logger.info "Game #{name} (BGG ID: #{bgg_id}): Created 5 initial reviews for manual registration"
      return
    end
    
    # BGGからゲーム情報を取得
    bgg_game_info = BggService.get_game_details(bgg_id)
    return unless bgg_game_info
    
    # 注意: BGGとサイトでは「カテゴリー」と「メカニクス」の概念が混在しています
    # これは意図的な設計で、日本のボードゲームユーザー向けに最適化された分類方法です
    # 
    # 変換の基本方針:
    # 1. BGGのカテゴリーやメカニクスの中には、当サイトのカテゴリーになるものとメカニクスになるものが混在しています
    # 2. マッピングにないBGGのカテゴリーやメカニクスは除外します（当サイトは過多な情報を必要としていません）
    # 3. BGGのベストプレイ人数 → 本サイトの「ソロ向き」「ペア向き」「多人数向き」カテゴリー
    
    # BGGカテゴリーから当サイトのカテゴリーへの変換マップ
    bgg_category_to_site_category_map = {
      'Animals' => '動物',
      'Bluffing' => 'ブラフ',
      'Card Game' => 'カードゲーム',
      "Children's Game" => '子供向け',
      'Deduction' => '推理',
      'Memory' => '記憶',
      'Negotiation' => '交渉',
      'Party Game' => 'パーティー',
      'Puzzle' => 'パズル',
      'Wargame' => 'ウォーゲーム',
      'Word Game' => 'ワードゲーム'
    }
    
    # BGGカテゴリーから当サイトのメカニクスへの変換マップ
    bgg_category_to_site_mechanic_map = {
      'Dice' => 'ダイスロール'
    }
    
    # BGGメカニクスから当サイトのカテゴリーへの変換マップ
    bgg_mechanic_to_site_category_map = {
      'Acting' => '演技',
      'Deduction' => '推理',
      'Legacy Game' => 'レガシー・キャンペーン',
      'Memory' => '記憶',
      'Negotiation' => '交渉',
      'Paper-and-Pencil' => '紙ペン',
      'Scenario / Mission / Campaign Game' => 'レガシー・キャンペーン',
      'Solo / Solitaire Game' => 'ソロ向き',
      'Pattern Building' => 'パズル',
      'Trick-taking' => 'トリテ'
    }
    
    # BGGメカニクスから当サイトのメカニクスへの変換マップ
    bgg_mechanic_to_site_mechanic_map = {
      'Area Majority / Influence' => 'エリア支配',
      'Auction / Bidding' => 'オークション',
      'Auction Compensation' => 'オークション',
      'Auction: Dexterity' => 'オークション',
      'Auction: Dutch' => 'オークション',
      'Auction: Dutch Priority' => 'オークション',
      'Auction: English' => 'オークション',
      'Auction: Fixed Placement' => 'オークション',
      'Auction: Multiple Lot' => 'オークション',
      'Auction: Once Around' => 'オークション',
      'Auction: Sealed Bid' => 'オークション',
      'Auction: Turn Order Until Pass' => 'オークション',
      'Betting and Bluffing' => '賭け',
      'Closed Drafting' => 'ドラフト',
      'Cooperative Game' => '協力',
      'Deck Construction' => 'デッキ/バッグビルド',
      'Deck, Bag, and Pool Building' => 'デッキ/バッグビルド',
      'Dice Rolling' => 'ダイスロール',
      'Hidden Roles' => '正体隠匿',
      'Modular Board' => 'モジュラーボード',
      'Network and Route Building' => 'ルート構築',
      'Open Drafting' => 'ドラフト',
      'Push Your Luck' => 'バースト',
      'Set Collection' => 'セット収集',
      'Simultaneous Action Selection' => '同時手番',
      'Tile Placement' => 'タイル配置',
      'Variable Player Powers' => 'プレイヤー別能力',
      'Variable Set-up' => 'プレイヤー別能力',
      'Worker Placement' => 'ワカプレ',
      'Worker Placement with Dice Workers' => 'ワカプレ',
      'Worker Placement, Different Worker Types' => 'ワカプレ'
    }
    
    # BGGのベストプレイ人数からサイトのカテゴリーへの変換マップ
    bgg_best_player_to_site_category_map = {
      '1' => 'ソロ向き',
      '2' => 'ペア向き',
      '6' => '多人数向き',
      '7' => '多人数向き',
      '8' => '多人数向き',
      '9' => '多人数向き',
      '10' => '多人数向き'
    }
    
    # 変換マップの最終更新日
    mapping_last_updated = '2023-03-07'
    
    # 変換マップが古い場合に警告を出す
    days_since_update = (Date.today - Date.parse(mapping_last_updated)).to_i
    if days_since_update > 180 # 6ヶ月以上経過
      Rails.logger.warn "BGG変換マップが#{days_since_update}日間更新されていません。最新のBGGカテゴリー/メカニクスに対応しているか確認してください。"
    end
    
    # BGGの評価を当サイトの評価に変換（BGGも10点満点）
    bgg_rating = bgg_game_info[:average_score].to_f
    return if bgg_rating <= 0
    
    # 5点以上10点以下に制限
    overall_score = [5.0, [bgg_rating, 10.0].min].max
    
    # BGGの重さを当サイトのルール複雑さに変換（5点満点に正規化）
    weight = bgg_game_info[:weight].to_f
    # 1点以上5点以下に制限
    rule_complexity = [1.0, [weight, 5.0].min].max
    
    # その他の評価項目は固定値3に設定
    luck_factor = 3
    interaction = 3
    downtime = 3
    
    # おすすめプレイ人数を設定
    recommended_players = []
    
    # BGGのベストプレイ人数を変換
    if bgg_game_info[:best_num_players].is_a?(Array)
      bgg_game_info[:best_num_players].each do |num|
        if num.present?
          # 7以上の値は「7」に変換
          player_num = num.to_i
          normalized_num = player_num >= 7 ? "7" : num
          recommended_players << normalized_num
        end
      end
    end
    
    # BGGのレコメンドプレイ人数も追加
    if bgg_game_info[:recommended_num_players].is_a?(Array)
      bgg_game_info[:recommended_num_players].each do |num|
        if num.present? && !recommended_players.include?(num)
          # 7以上の値は「7」に変換
          player_num = num.to_i
          normalized_num = player_num >= 7 ? "7" : num
          recommended_players << normalized_num if !recommended_players.include?(normalized_num)
        end
      end
    end
    
    # 最低でも1つはプレイ人数を設定
    if recommended_players.empty?
      if min_players == max_players
        recommended_players << min_players.to_s
      elsif min_players.present? && max_players.present?
        # 最小と最大の間でランダムに選択
        recommended_players << rand(min_players..max_players).to_s
      end
    end
    
    # タグを設定（BGGのベストプレイ人数から）
    categories_list = []
    
    # BGGのベストプレイ人数からタグを追加
    recommended_players.each do |num|
      site_tag = bgg_best_player_to_site_category_map[num.to_s]
      categories_list << site_tag if site_tag.present? && !categories_list.include?(site_tag)
    end
    
    # カテゴリーを設定（BGGのメカニクスとカテゴリーから）
    categories = []
    mechanics = []
    
    # BGGからカテゴリとメカニクスを変換
    BggService.convert_mechanics_and_categories(
      bgg_game_info[:mechanics], 
      bgg_game_info[:categories],
      recommended_players
    ) do |result_categories, result_mechanics|
      categories = result_categories
      mechanics = result_mechanics
    end
    
    # メカニクスを設定（BGGのカテゴリーとメカニクスから）
    mechanics = []
    
    # BGGのカテゴリーを当サイトのメカニクスに変換（指定されたもののみ）
    if bgg_game_info[:categories].is_a?(Array)
      Rails.logger.info "BGG Categories: #{bgg_game_info[:categories].inspect}"
      converted_mechanics = []
      missing_mechanics = []
      
      bgg_game_info[:categories].each do |category|
        site_mechanic = bgg_mechanic_to_site_mechanic_map[category]
        if site_mechanic.present?
          mechanics << site_mechanic if !mechanics.include?(site_mechanic)
          converted_mechanics << "#{category} → #{site_mechanic}"
        else
          missing_mechanics << category unless bgg_mechanic_to_site_category_map[category].present?
          # 未マッピングの項目を記録（カテゴリーとしても変換されていない場合のみ）
          UnmappedBggItem.record_occurrence('category', category) unless bgg_mechanic_to_site_category_map[category].present?
        end
      end
      
      Rails.logger.info "Converted from BGG categories to site mechanics: #{converted_mechanics.inspect}"
    end
    
    # 10件のレビューを作成
    10.times do |i|
      Review.create(
        user_id: system_user.id,
        game_id: bgg_id,
        overall_score: overall_score,
        rule_complexity: rule_complexity,
        luck_factor: luck_factor,
        interaction: interaction,
        downtime: downtime,
        recommended_players: recommended_players,
        mechanics: mechanics,
        categories: categories_list,
        short_comment: nil
      )
    end
    
    Rails.logger.info "Game #{name} (BGG ID: #{bgg_id}): Created 10 initial reviews"
  end

  # ゲーム編集履歴を作成
  def create_edit_history(old_attrs, new_attrs, editor)
    changes = {}
    
    # 変更があったフィールドのみを記録
    new_attrs.each do |key, value|
      if old_attrs[key] != value && !['updated_at', 'created_at', 'id'].include?(key)
        changes[key] = {
          old: old_attrs[key],
          new: value
        }
      end
    end
    
    # 変更があった場合のみ履歴を作成
    if changes.present?
      game_edit_histories.create(
        action: editor.is_a?(String) ? editor : editor.try(:email) || 'unknown',
        details: changes
      )
    end
  end

  # システムレビューを更新する
  def update_system_reviews
    # システムユーザーを取得
    system_user = User.find_by(email: 'system@boardgamereview.com')
    
    # システムユーザーが存在しない場合は、失敗
    unless system_user
      Rails.logger.error "システムユーザーが存在しません"
      return false
    end
    
    # 既存のシステムレビューを削除
    existing_reviews = reviews.where(user: system_user).count
    Rails.logger.info "既存のシステムレビュー数: #{existing_reviews}件"
    
    # 既存のレビューを削除（すべて削除し、新しく作り直し）
    reviews.where(user: system_user).destroy_all
    
    # BGGからシステムレビュー用の情報を取得
    Rails.logger.info "BGGからゲーム情報を取得中: #{bgg_id}"
    bgg_game_info = BggService.get_game_details(bgg_id)
    
    # BGG情報が取得できない場合は処理を中止
    if bgg_game_info.nil?
      Rails.logger.error "BGGからゲーム情報の取得に失敗しました: #{bgg_id}"
      return false
    end
    
    # レビュー用の値を計算
    # BGGの評価を当サイトの評価に変換（BGGも10点満点）
    bgg_rating = bgg_game_info[:average_score].to_f
    return false if bgg_rating <= 0
    
    # 5点以上10点以下に制限
    overall_score = [5.0, [bgg_rating, 10.0].min].max
    
    # BGGの重さを当サイトのルール複雑さに変換（5点満点に正規化）
    weight = bgg_game_info[:weight].to_f
    rule_complexity = [1.0, [weight, 5.0].min].max
    
    # その他の評価項目はBGGから取得した情報から推定
    # 例: 運要素が少ないゲームは戦略性が高く、インタラクションも多い傾向
    luck_factor = 5 - ((weight - 1) / 4 * 3)
    luck_factor = [1.0, [luck_factor, 5.0].min].max
    
    # インタラクションは重量級ゲームほど高い傾向
    interaction = 2 + ((weight - 1) / 4 * 3)
    interaction = [1.0, [interaction, 5.0].min].max
    
    # ダウンタイムも重量級ゲームほど長い傾向
    downtime = 2 + ((weight - 1) / 4 * 3)
    downtime = [1.0, [downtime, 5.0].min].max
    
    # おすすめプレイ人数を設定
    recommended_players = []
    
    # BGGのベストプレイ人数を変換
    if bgg_game_info[:best_num_players].is_a?(Array)
      bgg_game_info[:best_num_players].each do |num|
        if num.present?
          # 7以上の値は「7」に変換
          player_num = num.to_i
          normalized_num = player_num >= 7 ? "7" : num
          recommended_players << normalized_num
        end
      end
    end
    
    # BGGのレコメンドプレイ人数も追加
    if bgg_game_info[:recommended_num_players].is_a?(Array)
      bgg_game_info[:recommended_num_players].each do |num|
        if num.present? && !recommended_players.include?(num)
          # 7以上の値は「7」に変換
          player_num = num.to_i
          normalized_num = player_num >= 7 ? "7" : num
          recommended_players << normalized_num if !recommended_players.include?(normalized_num)
        end
      end
    end
    
    # 最低でも1つはプレイ人数を設定
    if recommended_players.empty?
      if min_players == max_players
        recommended_players << min_players.to_s
      elsif min_players.present? && max_players.present?
        # 最小と最大の間でランダムに選択
        recommended_players << rand(min_players..max_players).to_s
      end
    end
    
    # メカニクスとカテゴリの変換
    categories = []
    mechanics = []
    
    # BGGからカテゴリとメカニクスを変換
    BggService.convert_mechanics_and_categories(
      bgg_game_info[:mechanics], 
      bgg_game_info[:categories],
      recommended_players
    ) do |result_categories, result_mechanics|
      categories = result_categories
      mechanics = result_mechanics
    end
    
    # 少なくとも10個のレビューを作成
    10.times do |i|
      # わずかなランダム性を持たせる
      random_offset = (rand - 0.5) * 0.4 # -0.2から+0.2の間のランダム値
      
      # レビュー作成
      review = reviews.new(
        user: system_user,
        overall_score: [1.0, [overall_score + random_offset, 10.0].min].max,
        rule_complexity: [1.0, [rule_complexity + random_offset * 0.5, 5.0].min].max,
        luck_factor: [1.0, [luck_factor + random_offset * 0.5, 5.0].min].max,
        interaction: [1.0, [interaction + random_offset * 0.5, 5.0].min].max,
        downtime: [1.0, [downtime + random_offset * 0.5, 5.0].min].max,
        recommended_players: recommended_players,
        mechanics: mechanics,
        categories: categories,
        short_comment: "システムによる自動評価です"
      )
      
      # エラーがあれば記録
      unless review.save
        Rails.logger.error "レビュー保存エラー: #{review.errors.full_messages.join(', ')}"
      end
    end
    
    # 新しいレビュー数を記録
    new_reviews_count = reviews.where(user: system_user).count
    Rails.logger.info "新しいシステムレビュー数: #{new_reviews_count}件"
    
    # 平均値を更新
    update_average_values
    
    # 処理成功
    true
  end

  # ベースゲーム情報を返す
  def base_game
    metadata&.dig('base_game')
  end
  
  # 人気のタグを取得
  def popular_categories
    categories_count = {}
    
    reviews.each do |review|
      # カテゴリーとカスタムタグを結合
      all_categories = (review.categories || []) + (review.custom_tags || [])
      
      all_categories.each do |category|
        next unless category.present?
        categories_count[category] = (categories_count[category] || 0) + 1
      end
    end
    
    # 出現回数でソート
    categories_count.sort_by { |_, count| -count }.map { |category, count| { name: category, count: count } }
  end
  
  # 人気のメカニクスを取得
  def popular_mechanics
    mechanics = {}
    
    reviews.each do |review|
      (review.mechanics || []).each do |mechanic|
        next unless mechanic.present?
        mechanics[mechanic] = (mechanics[mechanic] || 0) + 1
      end
    end
    
    # 出現回数でソート
    mechanics.sort_by { |_, count| -count }.map { |mechanic, count| { name: mechanic, count: count } }
  end
end 