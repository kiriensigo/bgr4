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
  store :metadata, accessors: [:expansions, :base_game], coder: JSON

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
      json['baseGame'] = base_game
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
end 