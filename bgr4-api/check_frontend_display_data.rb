#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== Sherlock Holmes Consulting Detective プレイ人数表示問題調査 ==="

game = Game.find_by(bgg_id: '2511')

puts "ゲーム名: #{game.name}"
puts "BGG ID: #{game.bgg_id}"
puts

puts "=== BGGメタデータ ==="
puts "Best num players: #{game.metadata['best_num_players']}"
puts "Recommended num players: #{game.metadata['recommended_num_players']}"
puts

puts "=== サイトのデータ ==="
puts "site_recommended_players: #{game.site_recommended_players}"
puts "min_players: #{game.min_players}"
puts "max_players: #{game.max_players}"
puts

puts "=== recommended_playersメソッドの結果 ==="
recommended = game.recommended_players
puts "recommended_players: #{recommended}"
puts

puts "=== APIで返される値の確認 ==="
puts "GameSerializerで使用される値を確認..."

# フロントエンドで実際に使われるAPIデータを模擬
serialized_data = {
  id: game.id,
  name: game.name,
  min_players: game.min_players,
  max_players: game.max_players,
  site_recommended_players: game.site_recommended_players,
  recommended_players: game.recommended_players
}

puts "APIレスポンス模擬:"
puts "  min_players: #{serialized_data[:min_players]}"
puts "  max_players: #{serialized_data[:max_players]}"
puts "  site_recommended_players: #{serialized_data[:site_recommended_players]}"
puts "  recommended_players: #{serialized_data[:recommended_players]}"

puts

puts "=== BGGのベスト/推奨データの詳細分析 ==="
if game.metadata['best_num_players'].is_a?(Array)
  puts "BGG Best: #{game.metadata['best_num_players'].join(', ')}"
else
  puts "BGG Best: #{game.metadata['best_num_players']}"
end

if game.metadata['recommended_num_players'].is_a?(Array)
  puts "BGG Recommended: #{game.metadata['recommended_num_players'].join(', ')}"
else
  puts "BGG Recommended: #{game.metadata['recommended_num_players']}"
end

puts

puts "=== 期待される表示 ==="
puts "フロントエンド表示: 1人, 2人, 3人, 4人"
puts "現在の表示: 1人, 2人, 3人, 4人, 5人, 6人, 7人以上, 8人"
puts "→ 問題: BGGデータではなくmin/max範囲で表示されている可能性" 