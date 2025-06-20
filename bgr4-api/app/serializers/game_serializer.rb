class GameSerializer < ActiveModel::Serializer
  attributes :id, :bgg_id, :name, :japanese_name, :description, :japanese_description,
             :image_url, :japanese_image_url, :min_players, :max_players, :play_time, :min_play_time,
             :weight, :in_wishlist,
             :bgg_url, :publisher, :designer, :release_date, :japanese_release_date,
             :japanese_publisher, :expansions, :baseGame,
             # Calculated values
             :average_score, :reviews_count,
             :average_rule_complexity, :average_luck_factor, :average_interaction,
             :average_downtime, :popular_categories, :popular_mechanics, :site_recommended_players
  
  # BGGの元スコアはbgg_scoreとして返す
  attribute :bgg_score do
    object.bgg_score
  end

  # サイトの計算済み総合評価をaverage_scoreとして返す
  def average_score
    object.average_score_value
  end

  # サイトの計算済みルール複雑さを返す
  def average_rule_complexity
    object.average_rule_complexity_value
  end

  # サイトの計算済み運要素を返す
  def average_luck_factor
    object.average_luck_factor_value
  end

  # サイトの計算済みインタラクションを返す
  def average_interaction
    object.average_interaction_value
  end

  # サイトの計算済みダウンタイムを返す
  def average_downtime
    object.average_downtime_value
  end

  # ユーザーレビュー数をreviews_countとして返す
  def reviews_count
    object.user_reviews_count
  end

  def baseGame
    object.base_game
  end
  
  def in_wishlist
    # スコープ（current_user）が存在しない場合はfalseを返す
    return false unless scope && scope.is_a?(User)
    
    # ユーザーのウィッシュリストにこのゲームが含まれているかどうかを確認
    WishlistItem.exists?(user_id: scope.id, game: object.bgg_id)
  end
end 