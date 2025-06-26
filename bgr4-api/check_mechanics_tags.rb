#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== メカニクスとタグの表示問題調査 ==="
puts ""

# 最新の5ゲームのメカニクス・タグ状況
puts "=== 最新5ゲームのメカニクス・タグ状況 ==="
recent_games = Game.order(created_at: :desc).limit(5)

recent_games.each_with_index do |game, i|
  puts "#{i+1}. #{game.name} (BGG ID: #{game.bgg_id})"
  puts "   popular_categories: #{game.popular_categories || 'null'}"
  puts "   popular_mechanics: #{game.popular_mechanics || 'null'}"
  puts "   created_at: #{game.created_at}"
  puts ""
end

puts "=== 古いゲーム（正常表示されるもの）との比較 ==="
old_games = Game.where('created_at < ?', 1.day.ago)
                .where.not(popular_categories: nil)
                .where.not(popular_mechanics: nil)
                .limit(3)

old_games.each_with_index do |game, i|
  puts "#{i+1}. #{game.name} (BGG ID: #{game.bgg_id})"
  puts "   popular_categories: #{game.popular_categories}"
  puts "   popular_mechanics: #{game.popular_mechanics}"
  puts "   created_at: #{game.created_at}"
  puts ""
end

puts "=== メカニクス・カテゴリがnullのゲーム数 ==="
null_categories = Game.where(popular_categories: nil).count
null_mechanics = Game.where(popular_mechanics: nil).count
total_games = Game.count

puts "popular_categories が null: #{null_categories}件 / #{total_games}件"
puts "popular_mechanics が null: #{null_mechanics}件 / #{total_games}件"

puts ""
puts "=== BGG APIから取得できるデータの確認 ==="
# 最新ゲームのBGGデータを確認
latest_game = Game.order(created_at: :desc).first
if latest_game
  puts "最新ゲーム: #{latest_game.name} (BGG ID: #{latest_game.bgg_id})"
  puts "BGG APIからデータ再取得テスト..."
  
  begin
    game_data = BggService.get_game_details(latest_game.bgg_id)
    if game_data
      puts "  BGGから取得したカテゴリ: #{game_data[:categories] || 'なし'}"
      puts "  BGGから取得したメカニクス: #{game_data[:mechanics] || 'なし'}"
    else
      puts "  BGG APIからデータ取得失敗"
    end
  rescue => e
    puts "  エラー: #{e.message}"
  end
end 