#!/usr/bin/env ruby
# encoding: utf-8

# システムレビューの状況確認スクリプト

# システムユーザーを取得
system_user = User.find_by(email: 'system@boardgamereview.com')

if system_user.nil?
  puts "システムユーザーが見つかりません"
  exit
end

puts "システムユーザー見つかりました: #{system_user.email} (ID: #{system_user.id})"

# 全ゲーム数
total_games = Game.count
puts "全ゲーム数: #{total_games}件"

# システムレビューがあるゲーム数を直接カウント
games_with_system_reviews_count = Game.joins(:reviews)
                                    .where(reviews: { user_id: system_user.id })
                                    .distinct.count

# システムレビューがないゲーム数
games_without_system_reviews_count = total_games - games_with_system_reviews_count

# 結果表示
puts "====== システムレビュー状況 ======="
puts "システムレビューあり: #{games_with_system_reviews_count}件 (#{(games_with_system_reviews_count.to_f / total_games * 100).round(1)}%)"
puts "システムレビューなし: #{games_without_system_reviews_count}件 (#{(games_without_system_reviews_count.to_f / total_games * 100).round(1)}%)"

# システムレビューがあるゲームのサンプルを取得（SQLで直接取得）
sample_games = Game.joins(:reviews)
                  .where(reviews: { user_id: system_user.id })
                  .distinct
                  .limit(5)

puts
puts "システムレビューがあるゲームの例（最初の5件）:"
sample_games.each do |game|
  review_count = game.reviews.where(user_id: system_user.id).count
  puts "- #{game.name} (#{game.bgg_id}): #{review_count}件のシステムレビュー"
end 