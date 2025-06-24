puts "=== 登録されているゲーム一覧 ==="
games = Game.all
puts "総ゲーム数: #{games.count}件"
puts

# 最初の20件だけを表示
games.limit(20).each do |game|
  puts "BGG ID: #{game.bgg_id}, 日本語名: #{game.japanese_name || '未設定'}, 英語名: #{game.name || '未設定'}"
end

puts
puts "=== 特定のIDが存在するかチェック ==="
[7, 93, 110327, 366161].each do |id|
  game = Game.find_by(bgg_id: id)
  if game
    puts "ID #{id}: 存在 - #{game.japanese_name || game.name}"
  else
    puts "ID #{id}: 存在しない"
  end
end 