class Game < ApplicationRecord
  has_many :reviews, primary_key: :bgg_id, foreign_key: :game_id
  has_many :users, through: :reviews
  has_many :game_edit_histories

  validates :name, presence: true
  validates :min_players, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :max_players, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :play_time, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :average_score, numericality: {
    greater_than_or_equal_to: 0,
    less_than_or_equal_to: 10,
    allow_nil: true
  }

  def bgg_id
    self[:bgg_id] || id.to_s
  end

  def bgg_url
    "https://boardgamegeek.com/boardgame/#{bgg_id}" if bgg_id.present?
  end

  # BGGのURLをJSONレスポンスに含める
  def as_json(options = {})
    super(options).tap do |json|
      json['bgg_id'] = bgg_id
      json['bgg_url'] = bgg_url
    end
  end
end 