#!/usr/bin/env ruby
require_relative 'config/environment'

puts "Palm Island (BGG ID: 239464) の詳細確認..."

game = Game.find_by(bgg_id: 239464)

if game
  puts "=" * 50
  puts "ゲーム名: #{game.name}"
  puts "日本語名: #{game.japanese_name.presence || 'なし（nilまたは空）'}"
  puts "表示名: #{game.display_name}"
  puts "BGG ID: #{game.bgg_id}"
  puts "=" * 50
  
  # 中国語判定をテスト
  if game.japanese_name.present?
    require_relative 'app/services/language_detection_service'
    is_chinese = LanguageDetectionService.chinese?(game.japanese_name)
    puts "中国語判定: #{is_chinese ? 'YES (中国語)' : 'NO (日本語)'}"
  end
else
  puts "❌ ゲームが見つかりません"
end 