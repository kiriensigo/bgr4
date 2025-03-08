class UnmappedBggItem < ApplicationRecord
  validates :bgg_type, presence: true, inclusion: { in: ['category', 'mechanic'] }
  validates :bgg_name, presence: true, uniqueness: { scope: :bgg_type }
  
  # 出現回数をカウント
  def self.record_occurrence(type, name)
    return if name.blank?
    
    item = find_or_initialize_by(bgg_type: type, bgg_name: name)
    item.occurrence_count ||= 0
    item.occurrence_count += 1
    item.save
  end
  
  # 最も頻繁に出現する未マッピング項目を取得
  def self.most_frequent(limit = 20)
    order(occurrence_count: :desc).limit(limit)
  end
  
  # タイプ別に集計
  def self.count_by_type
    group(:bgg_type).count
  end
end
