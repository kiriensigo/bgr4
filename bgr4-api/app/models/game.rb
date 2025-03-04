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

  # ゲーム作成後に初期レビューを作成するコールバック
  after_create :create_initial_reviews

  def bgg_id
    self[:bgg_id] || id.to_s
  end

  def bgg_url
    "https://boardgamegeek.com/boardgame/#{bgg_id}" if bgg_id.present?
  end
  
  # このゲームのやりたいリストアイテムを取得
  def wishlist_items
    WishlistItem.where(game_id: bgg_id)
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

  # BGGからゲーム情報を更新
  def update_from_bgg
    bgg_data = BggService.get_game_details(bgg_id)
    
    return false if bgg_data.nil?
    
    # 古い属性を保存
    old_attributes = self.attributes
    
    # BGGから取得した情報で更新
    self.name = bgg_data[:name] if name.blank?
    self.description = bgg_data[:description] if description.blank?
    self.image_url = bgg_data[:image_url] if image_url.blank?
    self.min_players = bgg_data[:min_players] if min_players.blank?
    self.max_players = bgg_data[:max_players] if max_players.blank?
    self.play_time = bgg_data[:play_time] if play_time.blank?
    self.min_play_time = bgg_data[:min_play_time] if min_play_time.blank?
    self.weight = bgg_data[:weight] if weight.blank?
    self.publisher = bgg_data[:publisher] if publisher.blank?
    self.designer = bgg_data[:designer] if designer.blank?
    self.release_date = bgg_data[:release_date] if release_date.blank?
    
    # 日本語情報の更新
    if !has_japanese_name? && bgg_data[:japanese_name].present?
      self.japanese_name = bgg_data[:japanese_name]
    end
    
    if !has_japanese_publisher? && bgg_data[:japanese_publisher].present?
      self.japanese_publisher = bgg_data[:japanese_publisher]
    end
    
    if !has_japanese_release_date? && bgg_data[:japanese_release_date].present?
      self.japanese_release_date = bgg_data[:japanese_release_date]
    end
    
    # 拡張情報の更新
    self.expansions = bgg_data[:expansions] if expansions.blank?
    
    # ベストプレイ人数とおすすめプレイ人数の更新
    self.best_num_players = bgg_data[:best_num_players] if best_num_players.blank?
    self.recommended_num_players = bgg_data[:recommended_num_players] if recommended_num_players.blank?
    
    # カテゴリーとメカニクスの更新
    self.categories = bgg_data[:categories] if categories.blank?
    self.mechanics = bgg_data[:mechanics] if mechanics.blank?
    
    if changed?
      if save
        # 編集履歴を作成
        create_edit_history(old_attributes, self.attributes, 'system')
        return true
      else
        return false
      end
    end
    
    true
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
        changes: changes,
        editor: editor
      )
    end
  end
  
  # レビューの平均スコアを計算
  def calculate_average_score
    reviews.average(:score)&.round(1) || 0
  end
  
  # レビュー数を取得（システムユーザーを除く）
  def review_count
    reviews.count
  end
  
  # システムユーザーを除いたレビュー数を取得
  def user_review_count
    reviews.exclude_system_user.count
  end
  
  # 人気のタグを取得
  def popular_tags
    tags = {}
    
    reviews.each do |review|
      # タグとカスタムタグを結合
      all_tags = (review.tags || []) + (review.custom_tags || [])
      
      all_tags.each do |tag|
        next unless tag.present?
        tags[tag] = (tags[tag] || 0) + 1
      end
    end
    
    # 出現回数でソート
    tags.sort_by { |_, count| -count }.map { |tag, count| { name: tag, count: count } }
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
  
  # おすすめプレイ人数を取得
  def recommended_players
    player_counts = {}
    
    reviews.each do |review|
      (review.recommended_players || []).each do |count|
        next unless count.present?
        player_counts[count] = (player_counts[count] || 0) + 1
      end
    end
    
    # 出現回数でソート
    player_counts.sort_by { |_, count| -count }.map { |count, votes| { count: count, votes: votes } }
  end
  
  private
  
  # ゲーム登録時に初期レビューを作成する
  def create_initial_reviews
    # システムユーザーを取得
    system_user = User.find_by(email: 'system@boardgamereview.com')
    return unless system_user
    
    # BGGからゲーム情報を取得
    bgg_game_info = BggService.get_game_details(bgg_id)
    return unless bgg_game_info
    
    # BGGカテゴリーからサイトのメカニクスへの変換マップ（指定されたもののみ）
    bgg_category_to_site_mechanic = {
      'Animals' => '動物',
      'Bluffing' => 'ブラフ',
      'Card Game' => 'カードゲーム',
      "Children's Game" => '子供向け',
      'Deduction' => '推理',
      'Dice' => 'ダイス',
      'Memory' => '記憶',
      'Negotiation' => '交渉',
      'Party Game' => 'パーティー',
      'Puzzle' => 'パズル',
      'Wargame' => 'ウォーゲーム',
      'Word Game' => 'ワードゲーム'
    }
    
    # BGGメカニクスからサイトのカテゴリーへの変換マップ（指定されたもののみ）
    bgg_mechanic_to_site_category = {
      'Acting' => '演技',
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
      'Cooperative Game' => '協力ゲーム',
      'Deck Construction' => 'デッキ構築',
      'Deck, Bag, and Pool Building' => 'デッキ/バッグビルド',
      'Deduction' => '推理',
      'Dice Rolling' => 'ダイス',
      'Hidden Roles' => '正体隠匿',
      'Legacy Game' => 'レガシー・キャンペーン',
      'Memory' => '記憶',
      'Modular Board' => 'モジュラーボード',
      'Negotiation' => '交渉',
      'Network and Route Building' => 'ルート構築',
      'Open Drafting' => 'ドラフト',
      'Paper-and-Pencil' => '紙ペン',
      'Push Your Luck' => 'バースト',
      'Scenario / Mission / Campaign Game' => 'レガシー・キャンペーン',
      'Set Collection' => 'セット収集',
      'Simultaneous Action Selection' => '同時手番',
      'Solo / Solitaire Game' => 'ソロ向き',
      'Pattern Building' => 'パズル',
      'Tile Placement' => 'タイル配置',
      'Trick-taking' => 'トリテ',
      'Variable Player Powers' => 'プレイヤー別能力',
      'Variable Set-up' => 'プレイヤー別能力',
      'Worker Placement' => 'ワカプレ',
      'Worker Placement with Dice Workers' => 'ワカプレ',
      'Worker Placement, Different Worker Types' => 'ワカプレ',
      'Hand Management' => 'ハンドマネジメント'
    }
    
    # BGGのベストプレイ人数からサイトのタグへの変換マップ
    bgg_best_player_to_site_tag = {
      '1' => 'ソロ向き',
      '2' => 'ペア向き',
      '6' => '多人数向き',
      '7' => '多人数向き',
      '8' => '多人数向き',
      '9' => '多人数向き',
      '10' => '多人数向き'
    }
    
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
        recommended_players << num if num.present?
      end
    end
    
    # BGGのレコメンドプレイ人数も追加
    if bgg_game_info[:recommended_num_players].is_a?(Array)
      bgg_game_info[:recommended_num_players].each do |num|
        recommended_players << num if num.present? && !recommended_players.include?(num)
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
    tags = []
    
    # BGGのベストプレイ人数からタグを追加
    recommended_players.each do |num|
      site_tag = bgg_best_player_to_site_tag[num.to_s]
      tags << site_tag if site_tag.present? && !tags.include?(site_tag)
    end
    
    # カテゴリーを設定（BGGのメカニクスから）
    categories = []
    
    # BGGのメカニクスを変換（指定されたもののみ）
    if bgg_game_info[:mechanics].is_a?(Array)
      bgg_game_info[:mechanics].each do |mechanic|
        site_category = bgg_mechanic_to_site_category[mechanic]
        categories << site_category if site_category.present? && !categories.include?(site_category)
      end
    end
    
    # メカニクスを設定（BGGのカテゴリーから）
    mechanics = []
    
    # BGGのカテゴリーを変換（指定されたもののみ）
    if bgg_game_info[:categories].is_a?(Array)
      bgg_game_info[:categories].each do |category|
        site_mechanic = bgg_category_to_site_mechanic[category]
        mechanics << site_mechanic if site_mechanic.present? && !mechanics.include?(site_mechanic)
      end
    end
    
    # 短いコメントのリスト
    short_comments = [
      "戦略性が高く、何度でも遊びたくなるゲームです。",
      "シンプルなルールながら奥深い戦略性があります。",
      "テーマと機構がうまく融合した素晴らしいゲームです。",
      "初心者から上級者まで楽しめる万能な一作。",
      "コンポーネントの質が高く、見た目も美しいゲームです。",
      "プレイ時間の割に得られる満足感が大きいです。",
      "テーブルに出すと必ず盛り上がる名作です。",
      "戦略の幅が広く、リプレイ性に優れています。",
      "バランスが取れた素晴らしいデザインのゲームです。",
      "テンポよく進み、ダウンタイムが少ないのが魅力です。"
    ]
    
    # 10件のレビューを作成
    10.times do |i|
      # 各レビューで異なるコメントを使用
      short_comment = short_comments[i % short_comments.length]
      
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
        tags: tags,
        short_comment: short_comment
      )
    end
    
    Rails.logger.info "Game #{name} (BGG ID: #{bgg_id}): Created 10 initial reviews"
  end
end 