class WishlistItem < ApplicationRecord
  belongs_to :user
  # gameはbgg_idを参照するため、文字列として扱う
  # belongs_to :game, primary_key: :bgg_id, foreign_key: :game, optional: true
  
  validates :game, presence: true
  validates :user_id, uniqueness: { scope: :game, message: "既にこのゲームはやりたいリストに追加されています" }
  
  # ユーザーごとのやりたいリストの上限を10件に制限
  validate :wishlist_limit, on: :create
  
  # 作成時にpositionを自動設定
  before_create :set_position
  
  # ゲームを取得するメソッド
  def game_object
    Game.find_by(bgg_id: self.game)
  end
  
  private
  
  def wishlist_limit
    if user.wishlist_items.count >= 10
      errors.add(:base, "やりたいリストは最大10件までです")
    end
  end
  
  def set_position
    last_position = user.wishlist_items.maximum(:position) || 0
    self.position = last_position + 1
  end
end
