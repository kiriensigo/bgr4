#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== メタデータの状況確認（修正版） ==="
puts ""

# 最新の5ゲームを確認
recent_games = Game.where('created_at > ?', 2.days.ago)
                   .where(registered_on_site: true)
                   .limit(5)

puts "📊 最新5ゲームのメタデータ状況:"
puts ""

recent_games.each_with_index do |game, i|
  puts "#{i+1}. #{game.name} (BGG ID: #{game.bgg_id})"
  puts "   メタデータ存在: #{game.metadata.present?}"
  
  if game.metadata.present?
    # metadataはすでにHashなのでJSONパースしない
    metadata = game.metadata
    puts "   カテゴリ: #{metadata['categories']&.join(', ') || 'なし'}"
    puts "   メカニクス: #{metadata['mechanics']&.join(', ') || 'なし'}"
    
    # BGG変換結果
    bgg_cats = game.get_bgg_converted_categories
    bgg_mechs = game.get_bgg_converted_mechanics
    
    puts "   BGG変換カテゴリ: #{bgg_cats.join(', ')}"
    puts "   BGG変換メカニクス: #{bgg_mechs.join(', ')}"
    
    # popular_categories/mechanicsの確認
    pop_cats = game.popular_categories
    pop_mechs = game.popular_mechanics
    
    puts "   人気カテゴリ: #{pop_cats.map { |c| c[:name] }.join(', ')}"
    puts "   人気メカニクス: #{pop_mechs.map { |m| m[:name] }.join(', ')}"
  else
    puts "   メタデータなし"
  end
  
  puts ""
end

puts "=== 修正成功の確認 ==="
puts "メタデータありのゲーム数: #{Game.where('metadata IS NOT NULL').count}"
puts "メタデータなしのゲーム数: #{Game.where('metadata IS NULL').count}" 