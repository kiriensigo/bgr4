class Review < ApplicationRecord
  belongs_to :user
  belongs_to :game, primary_key: :bgg_id, foreign_key: :game_id

  has_many :likes, dependent: :destroy
  has_many :liked_users, through: :likes, source: :user

  validates :user_id, presence: true
  validates :game_id, presence: true
  validates :overall_score, presence: true, 
            numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 10 }
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

  # レビュー作成・更新・削除時にゲーム情報を更新するコールバック
  after_save :update_game_popular_features
  after_destroy :update_game_popular_features

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

  # ゲームの人気タグ、メカニクス、おすすめプレイ人数を更新
  def update_game_popular_features
    # システムユーザーのレビューは集計から除外
    system_user = User.find_by(email: 'system@boardgamereview.com')
    return if user == system_user

    # 非同期で更新処理を実行（パフォーマンス向上のため）
    UpdateGamePopularFeaturesJob.perform_later(game_id)
  end
end
