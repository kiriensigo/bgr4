#!/usr/bin/env ruby
require_relative 'config/environment'

puts "Palm Island (BGG ID: 239464) の中国語名を修正中..."

game = Game.find_by(bgg_id: 239464)

if game
  puts "現在の日本語名: #{game.japanese_name}"
  
  if game.japanese_name == "棕櫚島"
    game.update!(japanese_name: nil)
    puts "✅ 中国語名「棕櫚島」をnilに変更しました"
    puts "これで http://localhost:3001/games/239464 で原題「Palm Island」が表示されます"
  else
    puts "日本語名は既に修正済みか、別の値です"
  end
else
  puts "❌ ゲームが見つかりません"
end 