class GameExpansion < ApplicationRecord
  belongs_to :base_game, class_name: 'Game', primary_key: 'bgg_id', foreign_key: 'base_game_id'
  belongs_to :expansion, class_name: 'Game', primary_key: 'bgg_id', foreign_key: 'expansion_id'
  
  validates :base_game_id, presence: true
  validates :expansion_id, presence: true
  validates :relationship_type, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  
  # 同じベースゲームと拡張の組み合わせは一意であること
  validates :expansion_id, uniqueness: { scope: :base_game_id }
  
  # リレーションシップタイプの定数
  RELATIONSHIP_TYPES = {
    expansion: 'expansion',
    base: 'base',
    standalone_expansion: 'standalone_expansion',
    reimplementation: 'reimplementation'
  }
  
  # デフォルトのスコープ - 位置順
  default_scope { order(position: :asc) }
  
  # ベースゲームに対する拡張を取得
  scope :for_base_game, ->(bgg_id) { where(base_game_id: bgg_id) }
  
  # 拡張に対するベースゲームを取得
  scope :for_expansion, ->(bgg_id) { where(expansion_id: bgg_id) }
  
  # サイトに登録されている拡張のみを取得
  scope :registered_on_site, -> { 
    joins(:expansion).where(expansions_game_expansions: { registered_on_site: true })
  }
end
