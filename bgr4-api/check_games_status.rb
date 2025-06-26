#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== 現在のゲーム登録状況 ==="
total = Game.count
registered = Game.where(registered_on_site: true).count
puts "総ゲーム数: #{total}件"
puts "registered_on_site=true: #{registered}件"
puts "registered_on_site=false: #{total - registered}件"
puts ""

puts "=== 最近登録された5件 ==="
Game.order(created_at: :desc).limit(5).each_with_index do |g, i|
  puts "#{i+1}. #{g.name} (BGG ID: #{g.bgg_id})"
end
puts ""

puts "=== 前回確認時(176件)からの増加数 ==="
puts "増加数: #{total - 176}件"

puts "=== 最新登録ゲーム（上位10件）==="
Game.where(registered_on_site: true).order(created_at: :desc).limit(10).each_with_index do |game, index|
  puts "#{index + 1}. #{game.created_at.strftime('%Y-%m-%d %H:%M')} - #{game.japanese_name || game.name}"
end

puts ""
puts "=== Palm Island の情報 ==="
palm_island = Game.find_by(name: "Palm Island") || Game.find_by("name ILIKE ?", "%palm island%")
if palm_island
  puts "名前: #{palm_island.japanese_name || palm_island.name}"
  puts "登録日時: #{palm_island.created_at}"
  puts "サイト登録済み: #{palm_island.registered_on_site}"
else
  puts "Palm Islandが見つかりません"
end 