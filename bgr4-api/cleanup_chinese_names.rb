#!/usr/bin/env ruby
require_relative 'config/environment'

puts "=== 中国語名一括クリーンアップ ==="

# 全ての登録済みゲームの日本語名をチェック
games_with_japanese = Game.where(registered_on_site: true).where.not(japanese_name: nil)
total_count = games_with_japanese.count
chinese_count = 0
cleaned_count = 0

puts "チェック対象: #{total_count}件のゲーム"
puts ""

games_with_japanese.find_each.with_index do |game, index|
  if LanguageDetectionService.chinese?(game.japanese_name)
    chinese_count += 1
    puts "[#{index + 1}/#{total_count}] #{game.name}"
    puts "  中国語名: #{game.japanese_name}"
    puts "  BGG ID: #{game.bgg_id}"
    
    # 中国語名をnilに変更
    game.update!(japanese_name: nil)
    cleaned_count += 1
    puts "  ✅ クリーンアップ完了"
    puts ""
  end
  
  # 進捗表示（100件ごと）
  if (index + 1) % 100 == 0
    puts "進捗: #{index + 1}/#{total_count} (#{((index + 1).to_f / total_count * 100).round(1)}%)"
  end
end

puts "=== クリーンアップ結果 ==="
puts "チェック済み: #{total_count}件"
puts "中国語名発見: #{chinese_count}件"
puts "クリーンアップ: #{cleaned_count}件"
puts ""
puts "これで中国語名は表示されず、原題が表示されるようになります。" 