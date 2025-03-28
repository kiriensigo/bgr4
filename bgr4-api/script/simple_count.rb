#!/usr/bin/env ruby
# encoding: utf-8

# システムユーザーを取得
system_user = User.find_by(email: 'system@boardgamereview.com')

# 全ゲーム数
total_games = Game.count

# システムレビューがあるゲーム数
games_with_reviews = Game.joins(:reviews).where(reviews: {user_id: system_user.id}).distinct.count

# システムレビューがないゲーム数
games_without_reviews = total_games - games_with_reviews

puts "全ゲーム数: #{total_games}"
puts "システムレビューあり: #{games_with_reviews} (#{(games_with_reviews.to_f / total_games * 100).round(1)}%)"
puts "システムレビューなし: #{games_without_reviews} (#{(games_without_reviews.to_f / total_games * 100).round(1)}%)" 