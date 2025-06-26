#!/usr/bin/env ruby

require_relative 'config/environment'

game = Game.find_by(bgg_id: '4098')
puts "=== Age of Steam (#{game.name}) ==="
puts "Metadata: #{game.metadata.present? ? 'あり' : 'なし'}"
puts "Categories: #{game.categories&.length || 0}個"
puts "Mechanics: #{game.mechanics&.length || 0}個"
puts "BGG変換カテゴリー: #{game.get_bgg_converted_categories.join(', ')}"
puts "BGG変換メカニクス: #{game.get_bgg_converted_mechanics.join(', ')}"
puts "人気カテゴリー: #{game.popular_categories.map{|c| c[:name]}.join(', ')}"
puts "人気メカニクス: #{game.popular_mechanics.map{|m| m[:name]}.join(', ')}"
puts "プレイ人数推奨: #{game.site_recommended_players}" 