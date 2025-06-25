#!/usr/bin/env ruby
require_relative 'config/environment'

puts "=== Palm Island 中国語名修正 ==="

game = Game.find_by(bgg_id: 239464)

if game && game.japanese_name.present?
  puts "現在の日本語名: #{game.japanese_name}"
  
  if LanguageDetectionService.chinese?(game.japanese_name)
    puts "⚠️  この日本語名は中国語です！"
    game.update!(japanese_name: nil)
    puts "✅ 中国語の日本語名をnilにリセットしました"
    puts "これで http://localhost:3001/games/#{game.bgg_id} で中国語名が表示されなくなります"
  else
    puts "この日本語名は中国語ではありません"
  end
else
  puts "ゲームが見つからないか、日本語名がありません"
end 