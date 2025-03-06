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
user = User.find_or_create_by!(email: "test@example.com") do |u|
  u.name = "test_user"
  u.password = "Password123"
  u.uid = u.email
  u.provider = 'email'
  u.confirmed_at = Time.current
end

puts "Test user created: #{user.email}"

# システムユーザーの作成
system_user = User.find_or_create_by!(email: 'system@boardgamereview.com') do |u|
  u.name = 'BoardGameGeek'
  u.password = SecureRandom.hex(16)
  u.uid = u.email
  u.provider = 'email'
  u.confirmed_at = Time.current
end

puts "System user created: #{system_user.email}"

# 日本語出版社データの読み込み
load Rails.root.join('db', 'seeds', 'japanese_publishers.rb')

# BGGから人気ゲームを取得して保存
popular_games = BggService.get_popular_games(20)
popular_games.each do |game_data|
  game = Game.find_or_create_by!(bgg_id: game_data[:bgg_id]) do |g|
    g.name = game_data[:name]
    g.description = game_data[:description]
    g.image_url = game_data[:image_url]
    g.min_players = game_data[:min_players]
    g.max_players = game_data[:max_players]
    g.play_time = game_data[:play_time]
    g.average_score = game_data[:average_score]
  end

  # サンプルレビューの作成
  Review.find_or_create_by!(user: user, game: game) do |r|
    r.overall_score = rand(6.0..9.0).round(1)
    r.play_time = rand(1..5)
    r.rule_complexity = rand(1.0..5.0).round(1)
    r.luck_factor = rand(1.0..5.0).round(1)
    r.interaction = rand(1.0..5.0).round(1)
    r.downtime = rand(1.0..5.0).round(1)
    r.recommended_players = ["2人", "3人", "4人"]
    r.mechanics = ["Worker Placement", "Resource Management"]
    r.tags = ["戦略", "交渉"]
    r.custom_tags = ["お気に入り"]
    r.short_comment = "とても面白いゲームです！戦略性が高く、何度でも遊びたくなります。"
  end

  # BGGのスコアを初期レビューとして登録（10票分）
  if game_data[:average_score].present? && game_data[:average_score] > 0
    10.times do
      Review.find_or_create_by!(
        user: system_user,
        game: game,
        overall_score: game_data[:average_score],
        short_comment: "BoardGameGeekからの初期評価",
        rule_complexity: 3,
        luck_factor: 3,
        interaction: 3,
        downtime: 3,
        recommended_players: [],
        mechanics: [],
        tags: [],
        custom_tags: []
      )
    end
    
    # ゲームの平均スコアを更新
    game.update(average_score: game.reviews.average(:overall_score))
  end
end
