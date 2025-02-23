class Review < ApplicationRecord
  belongs_to :user
  belongs_to :game, primary_key: :bgg_id, foreign_key: :game_id

  has_many :likes, dependent: :destroy
  has_many :liked_users, through: :likes, source: :user

  validates :user_id, presence: true
  validates :game_id, presence: true
  validates :overall_score, presence: true, 
            numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 10 }
  validates :play_time, presence: true,
            numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }
  validates :rule_complexity, presence: true,
            numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 5 },
            allow_nil: true
  validates :luck_factor, presence: true,
            numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 5 },
            allow_nil: true
  validates :interaction, presence: true,
            numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 5 },
            allow_nil: true
  validates :downtime, presence: true,
            numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 5 },
            allow_nil: true
  validates :short_comment, presence: true

  def likes_count
    likes.count
  end

  def liked_by?(user)
    likes.exists?(user_id: user.id)
  end
end
