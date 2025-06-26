#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== 修正されたゲームの表示確認 ==="
puts ""

# 最近修正されたゲームをランダムに5件選択
test_games = Game.where('updated_at > ?', 1.hour.ago)
                 .where(registered_on_site: true)
                 .where.not(metadata: nil)
                 .sample(5)

puts "📊 テスト対象: #{test_games.count}件のゲーム"
puts ""

test_games.each_with_index do |game, i|
  puts "#{i+1}. #{game.name} (BGG ID: #{game.bgg_id})"
  puts "   URL: http://localhost:3001/games/#{game.bgg_id}"
  
  # BGG変換結果
  bgg_cats = game.get_bgg_converted_categories
  bgg_mechs = game.get_bgg_converted_mechanics
  
  puts "   BGG変換カテゴリ: #{bgg_cats.join(', ')}"
  puts "   BGG変換メカニクス: #{bgg_mechs.join(', ')}"
  
  # 人気カテゴリ・メカニクス
  pop_cats = game.popular_categories
  pop_mechs = game.popular_mechanics
  
  puts "   人気カテゴリ: #{pop_cats.map { |c| c[:name] }.join(', ')}"
  puts "   人気メカニクス: #{pop_mechs.map { |m| m[:name] }.join(', ')}"
  
  puts ""
end

puts "=== 修正前後の比較 ==="
puts ""

# メタデータありとなしの統計
with_metadata = Game.where(registered_on_site: true).where.not(metadata: nil).count
without_metadata = Game.where(registered_on_site: true).where(metadata: nil).count
total_games = Game.where(registered_on_site: true).count

puts "📊 データベース統計:"
puts "  総ゲーム数: #{total_games}"
puts "  メタデータあり: #{with_metadata} (#{(with_metadata.to_f / total_games * 100).round(1)}%)"
puts "  メタデータなし: #{without_metadata} (#{(without_metadata.to_f / total_games * 100).round(1)}%)"
puts ""

puts "✅ 修正作業完了！"
puts "   フロントエンドでカテゴリ・メカニクスが正常に表示されるはずです。" 