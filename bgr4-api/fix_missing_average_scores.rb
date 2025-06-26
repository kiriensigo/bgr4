#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== 新規登録ゲームのaverage_score_value修正 ==="
puts ""

# average_score_valueがnullで、bgg_scoreが設定されているゲームを取得
games_to_fix = Game.where(average_score_value: nil)
                   .where.not(bgg_score: nil)
                   .where(registered_on_site: true)

puts "修正対象ゲーム数: #{games_to_fix.count}件"
puts ""

fixed_count = 0
error_count = 0

games_to_fix.each_with_index do |game, i|
  begin
    # bgg_scoreをaverage_score_valueに設定
    game.update!(average_score_value: game.bgg_score)
    fixed_count += 1
    
    puts "#{i+1}. #{game.name} (BGG ID: #{game.bgg_id})"
    puts "   bgg_score: #{game.bgg_score} → average_score_value: #{game.average_score_value}"
    puts ""
    
  rescue => e
    error_count += 1
    puts "❌ エラー: #{game.name} - #{e.message}"
  end
end

puts "=" * 60
puts "🎉 修正完了"
puts "✅ 修正成功: #{fixed_count}件"
puts "❌ エラー: #{error_count}件"
puts "=" * 60

puts ""
puts "=== 修正後の確認 ==="
recent_games = Game.order(created_at: :desc).limit(5)

recent_games.each_with_index do |game, i|
  puts "#{i+1}. #{game.name}"
  puts "   average_score_value: #{game.average_score_value || 'null'}"
  puts "   bgg_score: #{game.bgg_score || 'null'}"
  puts ""
end 