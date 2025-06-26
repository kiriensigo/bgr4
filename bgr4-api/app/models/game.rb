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
  validates :bgg_score, numericality: {
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
  # after_create :create_initial_reviews  # システムレビューの自動作成を無効化

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
    # 説明文のHTMLエンティティをクリーンアップ
    if bgg_game_info[:description].present? && (description.blank? || force_update)
      self.description = DeeplTranslationService.cleanup_html_entities(bgg_game_info[:description])
    end
    self.image_url = bgg_game_info[:image_url] if image_url.blank? || force_update
    self.min_players = bgg_game_info[:min_players] if min_players.blank? || force_update
    self.max_players = bgg_game_info[:max_players] if max_players.blank? || force_update
    self.play_time = bgg_game_info[:play_time] if play_time.blank? || force_update
    self.min_play_time = bgg_game_info[:min_play_time] if min_play_time.blank? || force_update
    self.bgg_score = bgg_game_info[:average_score] if bgg_score.blank? || force_update
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
    reviews.average(:rule_complexity)&.round(1)
  end

  # 平均運要素を計算
  def average_luck_factor
    reviews.average(:luck_factor)&.round(1)
  end

  # 平均インタラクションを計算
  def average_interaction
    reviews.average(:interaction)&.round(1)
  end

  # 平均ダウンタイムを計算
  def average_downtime
    reviews.average(:downtime)&.round(1)
  end

  # 平均総合評価を計算
  def average_overall_score
    reviews.average(:overall_score)&.round(1)
  end

  # 平均値をデータベースに保存
  def update_average_values
    # スコア計算に必要な値を取得
    user_reviews = reviews.exclude_system_user
    review_count = user_reviews.count

    # 各項目の合計値を取得
    sum_overall_score = user_reviews.sum(:overall_score)
    sum_rule_complexity = user_reviews.sum(:rule_complexity)
    sum_interaction = user_reviews.sum(:interaction)
    sum_downtime = user_reviews.sum(:downtime)
    sum_luck_factor = user_reviews.sum(:luck_factor)

    # 基準点を設定
    is_bgg_game = bgg_id.present? && !bgg_id.start_with?('manual-')
    
    # BGGスコアは `bgg_score` カラムに格納されている
    base_overall_score = is_bgg_game ? (bgg_score.presence || 7.5) : 7.5 
    base_complexity = is_bgg_game ? (weight.presence || 3.0) : 3.0
    base_interaction = 3.0
    base_downtime = 3.0
    base_luck_factor = 3.0
    
    # 新しい計算式を適用
    # (全レビューの合計点 + 基準点 * 10) / (レビュー数 + 10)
    new_avg_score = review_count > 0 ? (sum_overall_score + base_overall_score * 10) / (review_count + 10) : base_overall_score
    new_avg_complexity = review_count > 0 ? (sum_rule_complexity + base_complexity * 10) / (review_count + 10) : base_complexity
    new_avg_interaction = review_count > 0 ? (sum_interaction + base_interaction * 10) / (review_count + 10) : base_interaction
    new_avg_downtime = review_count > 0 ? (sum_downtime + base_downtime * 10) / (review_count + 10) : base_downtime
    new_avg_luck_factor = review_count > 0 ? (sum_luck_factor + base_luck_factor * 10) / (review_count + 10) : base_luck_factor

    # データベースに保存
    # update_columns を使用してバリデーションとコールバックをスキップ
    update_columns(
      average_score_value: new_avg_score.round(2),
      average_rule_complexity_value: new_avg_complexity.round(2),
      average_interaction_value: new_avg_interaction.round(2),
      average_downtime_value: new_avg_downtime.round(2),
      average_luck_factor_value: new_avg_luck_factor.round(2),
      user_reviews_count: review_count
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

  # サイトのおすすめプレイ人数を取得（システムユーザーのレビューも含む）
  def site_recommended_players
    # データベースの値があればそれを使用
    if read_attribute(:site_recommended_players).present?
      read_attribute(:site_recommended_players)
    else
      # データベースの値がない場合はレビューから計算（後方互換性のため）
      count_player_recommendations(reviews)
    end
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
  
  # ゲーム登録時に初期処理を実行する
  # 注意: 新しいルールではシステムレビューは作成せず、BGG情報の重み付けのみを行う
  def create_initial_reviews(manual_registration = false)
    Rails.logger.info "Game #{name} (BGG ID: #{bgg_id}): Processing initial setup (new rule - no system reviews)"
    
    # 手動登録の場合は何もしない（BGG情報がないため）
    if manual_registration
      Rails.logger.info "Manual registration - skipping BGG weighted calculations"
      return
    end
    
    # BGG情報の重み付けカウントを実装（将来的にJobで処理予定）
    # 現在は平均値計算のみ実行
    update_average_values
    update_site_recommended_players
    
    Rails.logger.info "Game #{name} (BGG ID: #{bgg_id}): Completed initial setup without system reviews"
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
    return false unless system_user
    
    # システムユーザーのレビューを削除
    reviews.where(user_id: system_user.id).destroy_all
    
    # 初期レビューを作成
    create_initial_reviews
    
    true
  end

  # ベースゲーム情報を返す
  def base_game
    metadata&.dig('base_game')
  end
  
  # 人気のカテゴリーを取得（新しいルール: BGG重み付け方式）
  def popular_categories
    categories_count = {}
    
    # ユーザーレビューからカテゴリーを集計（システムユーザーを除く）
    user_reviews = reviews.exclude_system_user
    user_reviews.each do |review|
      # カテゴリーとカスタムタグを結合
      all_categories = (review.categories || []) + (review.custom_tags || [])
      
      all_categories.each do |category|
        next unless category.present?
        categories_count[category] = (categories_count[category] || 0) + 1
      end
    end
    
    # BGG情報から重み付け（×10）を追加
    if metadata.present? && bgg_id.present? && !bgg_id.start_with?('manual-')
      bgg_categories = get_bgg_converted_categories
      bgg_categories.each do |category|
        next unless category.present?
        categories_count[category] = (categories_count[category] || 0) + 10
      end
    end
    
    # 出現回数でソートして上位7件を返す
    sorted_categories = categories_count.sort_by { |_, count| -count }
    sorted_categories.first(7).map { |category, count| { name: category, count: count } }
  end
  
  # 人気のメカニクスを取得（新しいルール: BGG重み付け方式）
  def popular_mechanics
    mechanics_count = {}
    
    # ユーザーレビューからメカニクスを集計（システムユーザーを除く）
    user_reviews = reviews.exclude_system_user
    user_reviews.each do |review|
      (review.mechanics || []).each do |mechanic|
        next unless mechanic.present?
        mechanics_count[mechanic] = (mechanics_count[mechanic] || 0) + 1
      end
    end
    
    # BGG情報から重み付け（×10）を追加
    if metadata.present? && bgg_id.present? && !bgg_id.start_with?('manual-')
      bgg_mechanics = get_bgg_converted_mechanics
      bgg_mechanics.each do |mechanic|
        next unless mechanic.present?
        mechanics_count[mechanic] = (mechanics_count[mechanic] || 0) + 10
      end
    end
    
    # 出現回数でソートして上位7件を返す
    sorted_mechanics = mechanics_count.sort_by { |_, count| -count }
    sorted_mechanics.first(7).map { |mechanic, count| { name: mechanic, count: count } }
  end

  # サイトのおすすめプレイ人数を更新する
  def update_site_recommended_players
    # メタデータからrecommended_num_playersを取得
    if metadata.present? && metadata['recommended_num_players'].present?
      recommended_players = metadata['recommended_num_players']
      update!(site_recommended_players: recommended_players)
      Rails.logger.info "Updated site_recommended_players for game #{bgg_id}: #{recommended_players}"
      return recommended_players
    end
    
    # メタデータがない場合は、レビューデータから計算
    player_recommendations = count_player_recommendations(reviews)
    if player_recommendations.present?
      # 上位のプレイ人数を選択（例: 投票数が5以上）
      recommended = player_recommendations.select { |rec| rec[:votes] >= 5 }.map { |rec| rec[:count] }
      update!(site_recommended_players: recommended) if recommended.present?
      Rails.logger.info "Updated site_recommended_players from reviews for game #{bgg_id}: #{recommended}"
      return recommended
    end
    
    # どちらもない場合はmin_players〜max_playersの範囲を設定
    if min_players.present? && max_players.present?
      default_range = (min_players..max_players).map(&:to_s)
      update!(site_recommended_players: default_range)
      Rails.logger.info "Updated site_recommended_players with default range for game #{bgg_id}: #{default_range}"
      return default_range
    end
    
    []
  end

  # BGGカテゴリー・メカニクスをサイト形式に変換して取得
  def get_bgg_converted_categories
    return [] unless metadata.present?
    
    converted_categories = []
    
    # BGG変換マップ（.cursor/rulesから）
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
    
    # BGGのベストプレイ人数からカテゴリーを追加
    bgg_best_player_to_site_category_map = {
      '1' => 'ソロ向き',
      '2' => 'ペア向き',
      '6' => '多人数向き',
      '7' => '多人数向き',
      '8' => '多人数向き',
      '9' => '多人数向き',
      '10' => '多人数向き'
    }
    
    # BGGカテゴリーから変換
    if metadata['categories'].is_a?(Array)
      metadata['categories'].each do |bgg_category|
        site_category = bgg_category_to_site_category_map[bgg_category]
        converted_categories << site_category if site_category.present?
      end
    end
    
    # BGGメカニクスからカテゴリーに変換
    if metadata['mechanics'].is_a?(Array)
      metadata['mechanics'].each do |bgg_mechanic|
        site_category = bgg_mechanic_to_site_category_map[bgg_mechanic]
        converted_categories << site_category if site_category.present?
      end
    end
    
    # BGGベストプレイ人数からカテゴリーに変換
    if metadata['best_num_players'].is_a?(Array)
      metadata['best_num_players'].each do |player_count|
        site_category = bgg_best_player_to_site_category_map[player_count.to_s]
        converted_categories << site_category if site_category.present?
      end
    end
    
    converted_categories.uniq
  end

  def get_bgg_converted_mechanics
    return [] unless metadata.present?
    
    converted_mechanics = []
    
    # BGG変換マップ（.cursor/rulesから）
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
    
    bgg_category_to_site_mechanic_map = {
      'Dice' => 'ダイスロール'
    }
    
    # BGGメカニクスから変換
    if metadata['mechanics'].is_a?(Array)
      metadata['mechanics'].each do |bgg_mechanic|
        site_mechanic = bgg_mechanic_to_site_mechanic_map[bgg_mechanic]
        converted_mechanics << site_mechanic if site_mechanic.present?
      end
    end
    
    # BGGカテゴリーからメカニクスに変換
    if metadata['categories'].is_a?(Array)
      metadata['categories'].each do |bgg_category|
        site_mechanic = bgg_category_to_site_mechanic_map[bgg_category]
        converted_mechanics << site_mechanic if site_mechanic.present?
      end
    end
    
    converted_mechanics.uniq
  end

  # 日本語名の自動クリーンアップ（中国語を除外）
  before_save :cleanup_chinese_japanese_name

  private

  def cleanup_chinese_japanese_name
    if japanese_name.present? && LanguageDetectionService.chinese?(japanese_name)
      Rails.logger.info "中国語の日本語名を検出、nilに変更: #{japanese_name} (#{name})"
      self.japanese_name = nil
    end
  end
end 