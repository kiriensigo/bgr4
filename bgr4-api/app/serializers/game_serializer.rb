class GameSerializer < ActiveModel::Serializer
  attributes :id, :bgg_id, :name, :japanese_name, :description, :japanese_description,
             :image_url, :japanese_image_url, :min_players, :max_players, :play_time, :min_play_time,
             :average_score, :weight, :reviews_count, :in_wishlist,
             :average_rule_complexity, :average_luck_factor, :average_interaction,
             :average_downtime, :popular_tags, :popular_mechanics, :site_recommended_players,
             :bgg_url, :publisher, :designer, :release_date, :japanese_release_date,
             :japanese_publisher, :expansions, :baseGame

  def baseGame
    object.base_game
  end
end 