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
  store :metadata, accessors: [:expansions, :best_num_players, :recommended_num_players], coder: JSON

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
    end
  end

  # 日本語名を持つかどうかを確認
  def has_japanese_name?
    japanese_name.present?
  end
  
  # 日本語版の出版社を持つかどうかを確認
  def has_japanese_publisher?
    japanese_publisher.present?
  end
  
  # 日本語版の発売日を持つかどうかを確認
  def has_japanese_release_date?
    japanese_release_date.present?
  end
  
  # 日本語版の情報を持つかどうかを確認
  def has_japanese_info?
    has_japanese_name? || has_japanese_publisher? || has_japanese_release_date?
  end
  
  # 発売年を取得（日付から年のみを抽出）
  def release_year
    release_date&.year
  end
  
  # 日本語版の発売年を取得（日付から年のみを抽出）
  def japanese_release_year
    japanese_release_date&.year
  end

  # 日本語版の画像URLを取得するメソッド
  def japanese_image_url
    self[:japanese_image_url].presence || image_url
  end

  # プレイ時間を表示するメソッド（範囲がある場合は「min〜max分」、ない場合は「max分」）
  def formatted_play_time
    if min_play_time.present? && play_time.present? && min_play_time != play_time
      "#{min_play_time}〜#{play_time}分"
    else
      "#{play_time}分"
    end
  end

  # 日本語名が存在する場合は表示名として使用
  def display_name
    japanese_name.presence || name
  end
  
  # 日本語の説明文が存在する場合は表示説明として使用
  def display_description
    japanese_description.presence || description
  end
  
  # 日本語版の画像URLが存在する場合は表示画像として使用
  def display_image_url
    japanese_image_url.presence || image_url
  end
  
  # BGGからゲーム情報を取得して更新
  def update_from_bgg
    bgg_data = BggService.get_game_details(bgg_id)
    return false unless bgg_data
    
    # 更新前の状態を保存
    old_attributes = self.attributes.dup
    
    # BGGから取得した情報で更新
    self.name = bgg_data[:name]
    self.description = bgg_data[:description]
    self.image_url = bgg_data[:image_url]
    self.min_players = bgg_data[:min_players]
    self.max_players = bgg_data[:max_players]
    self.play_time = bgg_data[:play_time]
    self.min_play_time = bgg_data[:min_play_time]
    self.average_score = bgg_data[:average_score]
    self.weight = bgg_data[:weight]
    self.publisher = bgg_data[:publisher]
    self.designer = bgg_data[:designer]
    self.release_date = bgg_data[:release_date]
    self.best_num_players = bgg_data[:best_num_players]
    self.recommended_num_players = bgg_data[:recommended_num_players]
    
    # 日本語情報がある場合は更新
    self.japanese_name = bgg_data[:japanese_name] if bgg_data[:japanese_name].present?
    self.japanese_publisher = bgg_data[:japanese_publisher] if bgg_data[:japanese_publisher].present?
    self.japanese_release_date = bgg_data[:japanese_release_date] if bgg_data[:japanese_release_date].present?
    self.japanese_image_url = bgg_data[:japanese_image_url] if bgg_data[:japanese_image_url].present?
    self.japanese_description = bgg_data[:japanese_description] if bgg_data[:japanese_description].present?
    
    # 変更があった場合のみ保存
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
        player_counts[count.to_s] = (player_counts[count.to_s] || 0) + 1
      end
    end
    
    # 出現回数でソート
    player_counts.sort_by { |_, count| -count }.map { |count, votes| { count: count, votes: votes } }
  end
end 