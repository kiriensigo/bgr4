#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== Sherlock Holmes Consulting Detective プレイ人数修正 ==="

game = Game.find_by(bgg_id: '2511')

puts "ゲーム名: #{game.name}"
puts

puts "=== 修正前 ==="
puts "site_recommended_players: #{game.site_recommended_players}"
puts "BGG Recommended: #{game.metadata['recommended_num_players']}"
puts

puts "=== update_site_recommended_players実行 ==="
result = game.update_site_recommended_players
puts "実行結果: #{result}"
puts

puts "=== 修正後 ==="
game.reload
puts "site_recommended_players: #{game.site_recommended_players}"

puts

puts "=== 他の最近登録ゲームも確認・修正 ==="
recent_games = Game.where(created_at: 1.day.ago..).where.not(metadata: nil)
puts "対象ゲーム数: #{recent_games.count}"

recent_games.each do |g|
  puts
  puts "#{g.name} (#{g.bgg_id})"
  puts "  修正前: #{g.site_recommended_players}"
  
  if g.metadata && g.metadata['recommended_num_players']
    result = g.update_site_recommended_players
    g.reload
    puts "  修正後: #{g.site_recommended_players}"
  else
    puts "  BGGメタデータなし - スキップ"
  end
end

puts
puts "=== 修正完了 ===" 