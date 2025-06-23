class GameSerializer < ActiveModel::Serializer
  attributes :id, :bgg_id, :name, :japanese_name, :description, :japanese_description,
             :image_url, :japanese_image_url, :min_players, :max_players, :play_time, :min_play_time,
             :weight, :in_wishlist,
             :bgg_url, :publisher, :designer, :release_date, :japanese_release_date,
             :japanese_publisher, :expansions, :baseGame,
             # Calculated values
             :average_score, :reviews_count,
             :average_rule_complexity, :average_luck_factor, :average_interaction,
             :average_downtime, :site_recommended_players
  
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
  
  # 人気カテゴリー（名前のみを返す）
  def popular_categories
    return [] unless object.popular_categories.present?
    
    if object.popular_categories.is_a?(Array) && object.popular_categories.first.is_a?(Hash)
      # ハッシュの配列の場合、nameプロパティを抽出
      object.popular_categories.map { |cat| cat[:name] || cat['name'] }.compact
    else
      # 文字列の配列の場合、そのまま返す
      object.popular_categories
    end
  end
  
  # 人気メカニクス（名前のみを返す）
  def popular_mechanics
    return [] unless object.popular_mechanics.present?
    
    if object.popular_mechanics.is_a?(Array) && object.popular_mechanics.first.is_a?(Hash)
      # ハッシュの配列の場合、nameプロパティを抽出
      object.popular_mechanics.map { |mech| mech[:name] || mech['name'] }.compact
    else
      # 文字列の配列の場合、そのまま返す
      object.popular_mechanics
    end
  end
  
  def in_wishlist
    # スコープ（current_user）が存在しない場合はfalseを返す
    return false unless scope && scope.is_a?(User)
    
    # ユーザーのウィッシュリストにこのゲームが含まれているかどうかを確認
    WishlistItem.exists?(user_id: scope.id, game: object.bgg_id)
  end
end 