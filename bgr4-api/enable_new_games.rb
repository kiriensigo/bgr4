#!/usr/bin/env ruby

require_relative 'config/environment'

puts '=== 新規登録ゲームを表示可能にする ==='

# 今日登録された非表示ゲームを取得
today = Date.current
unregistered_today = Game.where(
  registered_on_site: false,
  created_at: today.beginning_of_day..today.end_of_day
)

puts "今日登録された非表示ゲーム: #{unregistered_today.count}件"

if unregistered_today.count > 0
  puts "\n更新対象のゲーム:"
  unregistered_today.limit(10).each_with_index do |game, index|
    puts "#{index + 1}. #{game.name} (BGG: #{game.bgg_id})"
  end
  
  if unregistered_today.count > 10
    puts "... その他#{unregistered_today.count - 10}件"
  end
  
  # 自動的に更新
  updated_count = unregistered_today.update_all(registered_on_site: true)
  puts "\n✅ #{updated_count}件のゲームを表示可能にしました！"
  
  # 更新後の状況確認
  total_registered = Game.where(registered_on_site: true).count
  puts "現在のサイト表示ゲーム数: #{total_registered}件"
else
  puts "\n更新対象のゲームがありません"
end 