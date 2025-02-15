# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# サンプルユーザーの作成
user = User.create!(
  name: "test_user",
  email: "test@example.com",
  password: "Password123"
)

# BGGから人気ゲームを取得して保存
popular_games = BggService.get_popular_games(20)
popular_games.each do |game_data|
  game = Game.create!(
    bgg_id: game_data[:bgg_id],
    name: game_data[:name],
    description: game_data[:description],
    image_url: game_data[:image_url],
    min_players: game_data[:min_players],
    max_players: game_data[:max_players],
    play_time: game_data[:play_time],
    average_score: game_data[:average_score]
  )

  # サンプルレビューの作成
  Review.create!(
    user: user,
    game: game,
    overall_score: rand(6.0..9.0).round(1),
    play_time: rand(1..5),
    rule_complexity: rand(1.0..5.0).round(1),
    luck_factor: rand(1.0..5.0).round(1),
    interaction: rand(1.0..5.0).round(1),
    downtime: rand(1.0..5.0).round(1),
    recommended_players: ["2人", "3人", "4人"],
    mechanics: ["Worker Placement", "Resource Management"],
    tags: ["戦略", "交渉"],
    custom_tags: ["お気に入り"],
    short_comment: "とても面白いゲームです！戦略性が高く、何度でも遊びたくなります。"
  )
end
