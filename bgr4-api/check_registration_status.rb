#!/usr/bin/env ruby
require_relative 'config/environment'

puts "=" * 50
puts "🎮 BGR ゲーム登録状況レポート"
puts "=" * 50

total_games = Game.count
japanese_games = Game.where.not(japanese_name: [nil, '']).count
japanese_rate = (japanese_games.to_f / total_games * 100).round(1)

puts "📊 登録状況:"
puts "   合計登録ゲーム数: #{total_games}件"
puts "   日本語名付きゲーム: #{japanese_games}件"
puts "   日本語化率: #{japanese_rate}%"

puts "\n🎯 最近登録されたゲーム（TOP 10）:"
recent_games = Game.order(created_at: :desc).limit(10)
recent_games.each_with_index do |game, index|
  display_name = game.japanese_name.presence || game.name
  puts "  #{index + 1}. #{display_name} (BGG: #{game.bgg_id})"
end

puts "\n🇯🇵 日本語名が設定されているゲーム（サンプル）:"
japanese_sample = Game.where.not(japanese_name: [nil, '']).order(:created_at).limit(5)
japanese_sample.each_with_index do |game, index|
  puts "  #{index + 1}. #{game.japanese_name} (原題: #{game.name})"
end

puts "\n" + "=" * 50
puts "✅ BGGからのゲーム登録が成功しています！" 