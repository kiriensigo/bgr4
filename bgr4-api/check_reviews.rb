#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== 新規ゲームのレビュー状況確認 ==="
puts ""

# システムユーザーの確認
system_user = User.find_by(email: 'system@boardgamereview.com')
puts "システムユーザー: #{system_user ? system_user.name : '見つかりません'}"
puts ""

# 最新の5ゲームのレビュー状況
puts "=== 最新5ゲームのレビュー状況 ==="
recent_games = Game.order(created_at: :desc).limit(5)

recent_games.each_with_index do |game, i|
  total_reviews = game.reviews.count
  system_reviews = game.reviews.joins(:user).where(users: {email: 'system@boardgamereview.com'}).count
  
  puts "#{i+1}. #{game.name}"
  puts "   総レビュー数: #{total_reviews}件"
  puts "   システムレビュー数: #{system_reviews}件"
  puts "   average_score_value: #{game.average_score_value || 'null'}"
  puts ""
end

puts "=== 古いゲーム（正常なもの）のレビュー状況 ==="
old_games = Game.where('created_at < ?', 1.day.ago).where.not(average_score_value: nil).limit(3)

old_games.each_with_index do |game, i|
  total_reviews = game.reviews.count
  system_reviews = game.reviews.joins(:user).where(users: {email: 'system@boardgamereview.com'}).count
  
  puts "#{i+1}. #{game.name}"
  puts "   総レビュー数: #{total_reviews}件"
  puts "   システムレビュー数: #{system_reviews}件"
  puts "   average_score_value: #{game.average_score_value}"
  puts ""
end 