class JapanesePublisher < ApplicationRecord
  validates :bgg_id, presence: true, uniqueness: true
  validates :publisher_name, presence: true
  
  # BGG IDで検索するスコープ
  scope :by_bgg_id, ->(bgg_id) { where(bgg_id: bgg_id) }
  
  # 特定のゲームの出版社名を取得するクラスメソッド
  def self.get_publisher_name(bgg_id)
    find_by(bgg_id: bgg_id)&.publisher_name
  end
end
