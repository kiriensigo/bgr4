#!/usr/bin/env ruby

require_relative 'config/environment'

puts "BGG ID 172818 新しいルール対応中..."

game = Game.find_by(bgg_id: '172818')

if !game
  puts "ゲームが見つかりません"
  exit
end

puts "\n=== 修正前の状態 ==="
puts "ゲーム名: #{game.name} (#{game.japanese_name})"
puts "総レビュー数: #{game.reviews.count}"

# システムユーザーを確認
system_user = User.find_by(email: 'system@boardgamereview.com')
if system_user
  system_reviews = game.reviews.where(user: system_user)
  puts "システムレビュー数: #{system_reviews.count}"
  
  if system_reviews.any?
    puts "\n=== システムレビューを削除中... ==="
    deleted_count = system_reviews.count
    system_reviews.destroy_all
    puts "削除したシステムレビュー数: #{deleted_count}"
  else
    puts "削除するシステムレビューはありません"
  end
else
  puts "システムユーザーが見つかりません"
end

puts "\n=== 新しいルールでの計算実行 ==="
# 平均値を再計算
game.update_average_values

# プレイ人数推奨も更新（privateメソッドなので send を使用）
if game.metadata.present? && game.metadata['recommended_num_players'].present?
  recommended_players = game.metadata['recommended_num_players']
  game.update!(site_recommended_players: recommended_players)
  puts "Updated site_recommended_players: #{recommended_players}"
else
  puts "メタデータからrecommended_num_playersが見つかりません"
end

puts "\n=== 修正後の状態確認 ==="
puts "ユーザーレビュー数: #{game.reviews.exclude_system_user.count}"
puts "総レビュー数: #{game.reviews.count}"
puts "システムレビュー数: #{game.reviews.joins(:user).where(users: { email: 'system@boardgamereview.com' }).count}"

puts "\n=== 新しいルールでのカテゴリー・メカニクス ==="
popular_categories = game.popular_categories
puts "人気カテゴリー: #{popular_categories.map { |c| "#{c[:name]}(#{c[:count]})" }.join(', ')}"

popular_mechanics = game.popular_mechanics  
puts "人気メカニクス: #{popular_mechanics.map { |m| "#{m[:name]}(#{m[:count]})" }.join(', ')}"

puts "\n=== BGG重み付けによる結果 ==="
puts "site_recommended_players: #{game.site_recommended_players}"
puts "average_score: #{game.average_score_value}"
puts "修正完了！新しいルール（BGG重み付け×10、システムレビューなし）に対応済み" 