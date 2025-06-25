#!/usr/bin/env ruby

require_relative 'config/environment'

puts "BGG ID 172818のカテゴリー・メカニクス情報を確認中..."

game = Game.find_by(bgg_id: '172818')

puts "\n=== 基本情報 ==="
puts "ゲーム名: #{game.name} (#{game.japanese_name})"
puts "BGG ID: #{game.bgg_id}"

puts "\n=== メタデータのカテゴリー・メカニクス ==="
if game.metadata.present?
  puts "Categories: #{game.metadata['categories']}"
  puts "Mechanics: #{game.metadata['mechanics']}"
else
  puts "メタデータなし"
end

puts "\n=== Gameモデルのカテゴリー・メカニクス ==="
puts "categories (JSON): #{game.categories}"
puts "mechanics (JSON): #{game.mechanics}"

puts "\n=== レビューからのカテゴリー・メカニクス統計 ==="
puts "総レビュー数: #{game.reviews.count}"

# システムユーザーを確認
system_user = User.find_by(email: 'system@boardgamereview.com')
if system_user
  system_reviews = game.reviews.where(user: system_user)
  puts "システムレビュー数: #{system_reviews.count}"
  
  if system_reviews.any?
    sample_review = system_reviews.first
    puts "\nサンプルシステムレビュー:"
    puts "  categories: #{sample_review.categories}"
    puts "  mechanics: #{sample_review.mechanics}"
    puts "  custom_tags: #{sample_review.custom_tags}"
  end
end

puts "\n=== popular_categoriesメソッドの結果 ==="
popular_cats = game.popular_categories
puts "Popular categories: #{popular_cats.inspect}"

puts "\n=== popular_mechanicsメソッドの結果 ==="
popular_mechs = game.popular_mechanics
puts "Popular mechanics: #{popular_mechs.inspect}"

puts "\n=== BGGから最新データを取得してみます... ==="
bgg_data = BggService.get_game_details('172818')

if bgg_data
  puts "\n=== BGGから取得したメタ情報 ==="
  puts "BGG Categories: #{bgg_data[:categories]}"
  puts "BGG Mechanics: #{bgg_data[:mechanics]}"
  
  puts "\n=== システムレビューの作成に使われたであろうデータ ==="
  puts "これらのデータがシステムレビューに反映されているか確認"
else
  puts "BGGデータの取得に失敗"
end 