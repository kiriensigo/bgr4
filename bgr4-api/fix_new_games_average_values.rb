#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== 新規登録ゲームの平均値・カテゴリ・メカニクス修正 ==="
puts ""

# 最近2日以内に登録されたゲーム（新規登録ゲーム）を対象
recent_games = Game.where('created_at > ?', 2.days.ago)
                   .where(registered_on_site: true)

puts "📊 対象ゲーム数: #{recent_games.count}件"
puts ""

fixed_count = 0
error_count = 0

recent_games.each_with_index do |game, i|
  begin
    puts "#{i+1}/#{recent_games.count}: #{game.name} (BGG ID: #{game.bgg_id})"
    
    # 現在の状態を表示
    puts "  現在の平均値:"
    puts "    average_score_value: #{game.average_score_value}"
    puts "    average_rule_complexity_value: #{game.average_rule_complexity_value}"
    puts "    average_interaction_value: #{game.average_interaction_value}"
    puts "    average_downtime_value: #{game.average_downtime_value}"
    puts "    average_luck_factor_value: #{game.average_luck_factor_value}"
    
    puts "  現在のカテゴリ・メカニクス:"
    puts "    popular_categories: #{game.popular_categories.map { |c| c[:name] }.join(', ')}"
    puts "    popular_mechanics: #{game.popular_mechanics.map { |m| m[:name] }.join(', ')}"
    
    # update_average_valuesを実行
    puts "  🔧 平均値を再計算中..."
    game.update_average_values
    
    # 結果を再読み込み
    game.reload
    
    puts "  修正後の平均値:"
    puts "    average_score_value: #{game.average_score_value}"
    puts "    average_rule_complexity_value: #{game.average_rule_complexity_value}"
    puts "    average_interaction_value: #{game.average_interaction_value}"
    puts "    average_downtime_value: #{game.average_downtime_value}"
    puts "    average_luck_factor_value: #{game.average_luck_factor_value}"
    
    puts "  修正後のカテゴリ・メカニクス:"
    puts "    popular_categories: #{game.popular_categories.map { |c| c[:name] }.join(', ')}"
    puts "    popular_mechanics: #{game.popular_mechanics.map { |m| m[:name] }.join(', ')}"
    
    fixed_count += 1
    puts "  ✅ 修正完了"
    
  rescue => e
    error_count += 1
    puts "  ❌ エラー: #{e.message}"
  end
  
  puts ""
end

puts "=" * 60
puts "🎉 新規登録ゲームの修正完了！"
puts "✅ 修正成功: #{fixed_count}件"
puts "❌ エラー: #{error_count}件"
puts "=" * 60 