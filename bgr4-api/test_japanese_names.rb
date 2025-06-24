#!/usr/bin/env ruby

# Load Rails environment
require File.expand_path('../config/environment', __FILE__)

puts "=== 日本語名テスト ==="

# Test some games
test_games = ['El Grande', 'Azul', 'Wingspan', 'Brass: Birmingham']

test_games.each do |game_name|
  game = Game.find_by(name: game_name)
  if game
    puts "#{game_name}: '#{game.japanese_name}'"
  else
    puts "#{game_name}: ゲームが見つかりません"
  end
end

puts "\n=== BGGサービステスト ==="
# Test BGG service with specific game
el_grande = Game.find_by(name: 'El Grande')
if el_grande && el_grande.bgg_id
  puts "El Grande (BGG ID: #{el_grande.bgg_id}) のテスト"
  
  begin
    bgg_data = BggService.fetch_game_details(el_grande.bgg_id)
    if bgg_data
      japanese_name = BggService.extract_japanese_name(bgg_data)
      puts "BGGから取得された日本語名: '#{japanese_name}'"
    else
      puts "BGGデータの取得に失敗"
    end
  rescue => e
    puts "エラー: #{e.message}"
  end
end 