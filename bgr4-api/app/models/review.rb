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
            numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 1000 }
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
  
  # システムユーザー以外は同じゲームに対して1つのレビューのみ許可
  validate :validate_one_review_per_game_for_non_system_user

  def likes_count
    likes.count
  end

  def liked_by?(user)
    likes.exists?(user_id: user.id)
  end

  private

  def validate_one_review_per_game_for_non_system_user
    return if user&.email == 'system@boardgamereview.com'
    
    if Review.where(user: user, game_id: game_id)
            .where.not(id: id) # 自分自身は除外（更新時のため）
            .exists?
      errors.add(:base, '同じゲームに対して複数のレビューを投稿することはできません')
    end
  end
end
