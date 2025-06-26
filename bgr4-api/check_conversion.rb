#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== BGGメタデータ変換チェック ==="

game = Game.find_by(bgg_id: '296151')

puts "\nゲーム名: #{game.name}"
puts "日本語名: #{game.japanese_name}"

puts "\n=== BGGメタデータ ==="
puts "Categories: #{game.metadata['categories']}"
puts "Mechanics: #{game.metadata['mechanics']}"

puts "\n=== 変換結果 ==="
converted_categories = game.get_bgg_converted_categories
converted_mechanics = game.get_bgg_converted_mechanics

puts "変換後カテゴリー: #{converted_categories}"
puts "変換後メカニクス: #{converted_mechanics}"

puts "\n=== popular_categories/mechanicsの結果 ==="
popular_cats = game.popular_categories
popular_mechs = game.popular_mechanics

puts "Popular categories:"
popular_cats.each do |cat|
  puts "  #{cat[:name]} (#{cat[:count]})"
end

puts "\nPopular mechanics:"
popular_mechs.each do |mech|
  puts "  #{mech[:name]} (#{mech[:count]})"
end

puts "\n=== 変換マップの確認 ==="
puts "Medieval -> #{game.send(:get_bgg_converted_categories).include?('中世') ? '中世' : '変換なし'}"
puts "End Game Bonuses -> #{game.send(:get_bgg_converted_mechanics).include?('エンドゲーム') ? 'エンドゲーム' : '変換なし'}"
puts "Hand Management -> #{game.send(:get_bgg_converted_mechanics).include?('ハンドマネジメント') ? 'ハンドマネジメント' : '変換なし'}" 