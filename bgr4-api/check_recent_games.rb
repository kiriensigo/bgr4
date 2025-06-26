#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== 最近のゲーム3件の変換確認 ==="

Game.where.not(metadata: nil).order(created_at: :desc).limit(3).each do |game|
  puts
  puts "#{game.name} (#{game.bgg_id})"
  puts "日本語名: #{game.japanese_name}"
  
  converted_categories = game.get_bgg_converted_categories
  converted_mechanics = game.get_bgg_converted_mechanics
  
  puts "カテゴリー: #{converted_categories.join(', ')}"
  puts "メカニクス: #{converted_mechanics.join(', ')}"
  
  # popular_categories/mechanicsの結果も確認
  popular_cats = game.popular_categories.map { |cat| "#{cat[:name]}(#{cat[:count]})" }
  popular_mechs = game.popular_mechanics.map { |mech| "#{mech[:name]}(#{mech[:count]})" }
  
  puts "Popular Categories: #{popular_cats.join(', ')}"
  puts "Popular Mechanics: #{popular_mechs.join(', ')}"
end 