#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== 新規登録ゲームの表示問題調査 ==="
puts ""

# 最近登録された5件のゲームの詳細情報を確認
puts "=== 最近登録された5件の詳細情報 ==="
recent_games = Game.order(created_at: :desc).limit(5)

recent_games.each_with_index do |game, i|
  puts "#{i+1}. #{game.name} (BGG ID: #{game.bgg_id})"
  puts "   ID: #{game.id}"
  puts "   created_at: #{game.created_at}"
  puts "   updated_at: #{game.updated_at}"
  puts "   image_url: #{game.image_url.present? ? 'あり' : 'なし'}"
  puts "   description: #{game.description.present? ? 'あり' : 'なし'}"
  puts "   japanese_name: #{game.japanese_name.present? ? game.japanese_name : 'なし'}"
  puts "   min_players: #{game.min_players}"
  puts "   max_players: #{game.max_players}"
  puts "   play_time: #{game.play_time}"
  puts "   bgg_score: #{game.bgg_score}"
  puts "   weight: #{game.weight}"
  puts "   average_score_value: #{game.average_score_value}"
  puts ""
end

puts "=== 古いゲーム（正常表示されるもの）との比較 ==="
old_games = Game.where('created_at < ?', 1.day.ago).order(created_at: :desc).limit(3)

old_games.each_with_index do |game, i|
  puts "#{i+1}. #{game.name} (BGG ID: #{game.bgg_id})"
  puts "   ID: #{game.id}"
  puts "   created_at: #{game.created_at}"
  puts "   image_url: #{game.image_url.present? ? 'あり' : 'なし'}"
  puts "   description: #{game.description.present? ? 'あり' : 'なし'}"
  puts "   japanese_name: #{game.japanese_name.present? ? game.japanese_name : 'なし'}"
  puts "   average_score_value: #{game.average_score_value}"
  puts ""
end

puts "=== registered_on_site属性の確認 ==="
puts "registered_on_site属性が存在するか: #{Game.column_names.include?('registered_on_site')}"

puts ""
puts "=== APIレスポンスのテスト ==="
puts "最新ゲームのAPIレスポンス確認..."

# 最新のゲームのAPIレスポンスをシミュレート
latest_game = Game.order(created_at: :desc).first
if latest_game
  puts "ゲーム名: #{latest_game.name}"
  puts "API経由でのアクセステスト:"
  puts "  /api/games/#{latest_game.id} でアクセス可能か確認が必要"
end 