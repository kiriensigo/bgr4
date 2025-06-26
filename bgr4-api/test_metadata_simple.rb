#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== メタデータの状況確認 ==="
puts ""

# 最新の3ゲームを確認
recent_games = Game.where('created_at > ?', 2.days.ago)
                   .where(registered_on_site: true)
                   .limit(3)

puts "📊 最新3ゲームのメタデータ状況:"
puts ""

recent_games.each_with_index do |game, i|
  puts "#{i+1}. #{game.name} (BGG ID: #{game.bgg_id})"
  puts "   メタデータ存在: #{game.metadata.present?}"
  
  if game.metadata.present?
    begin
      metadata = JSON.parse(game.metadata)
      puts "   カテゴリ: #{metadata['categories']&.join(', ') || 'なし'}"
      puts "   メカニクス: #{metadata['mechanics']&.join(', ') || 'なし'}"
      
      # BGG変換結果
      bgg_cats = game.get_bgg_converted_categories
      bgg_mechs = game.get_bgg_converted_mechanics
      
      puts "   BGG変換カテゴリ: #{bgg_cats.join(', ')}"
      puts "   BGG変換メカニクス: #{bgg_mechs.join(', ')}"
      
    rescue JSON::ParserError => e
      puts "   ❌ JSON解析エラー: #{e.message}"
    end
  else
    puts "   ❌ メタデータなし"
  end
  
  puts ""
end

puts "=" * 50 