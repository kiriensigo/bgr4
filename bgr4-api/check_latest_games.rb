puts "=== 最新20件のゲーム ==="
Game.where(registered_on_site: true).order(created_at: :desc).limit(20).each_with_index do |game, index|
  puts "#{index + 1}. #{game.created_at.strftime('%m/%d %H:%M')} - #{game.japanese_name || game.name}"
end

puts ""
puts "=== 登録されていないゲーム（上位10件）==="
Game.where(registered_on_site: false).order(created_at: :desc).limit(10).each_with_index do |game, index|
  puts "#{index + 1}. #{game.created_at.strftime('%m/%d %H:%M')} - #{game.japanese_name || game.name}"
end

puts ""
puts "=== 今日登録されたゲーム ==="
today_games = Game.where(registered_on_site: true).where("created_at >= ?", Date.current)
puts "今日登録されたゲーム数: #{today_games.count}"
today_games.order(created_at: :desc).each_with_index do |game, index|
  puts "#{index + 1}. #{game.created_at.strftime('%H:%M')} - #{game.japanese_name || game.name}"
end 