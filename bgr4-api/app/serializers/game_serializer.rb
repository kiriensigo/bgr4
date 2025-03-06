class GameSerializer < ActiveModel::Serializer
  attributes :id, :bgg_id, :name, :japanese_name, :description, :japanese_description,
             :image_url, :japanese_image_url, :min_players, :max_players, :play_time, :min_play_time,
             :average_score, :weight, :reviews_count, :in_wishlist,
             :average_rule_complexity, :average_luck_factor, :average_interaction,
             :average_downtime, :popular_categories, :popular_mechanics, :site_recommended_players,
             :bgg_url, :publisher, :designer, :release_date, :japanese_release_date,
             :japanese_publisher, :expansions, :baseGame

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