puts "=== 現在のゲーム登録状況 ==="
games = Game.all.order(:created_at)
puts "総ゲーム数: #{games.count}件"
puts

puts "=== 最初の10件のゲーム ==="
games.limit(10).each do |game|
  puts "BGG ID: #{game.bgg_id}, 英語名: #{game.name || '未設定'}, 日本語名: #{game.japanese_name || '未設定'}"
end

puts
puts "=== ゲームIDの形式確認 ==="
# BGG IDとして数字のみのもの
numeric_games = games.where("bgg_id ~ '^[0-9]+$'").count
puts "数字のみのBGG ID: #{numeric_games}件"

# 手動登録（J形式）のもの
manual_games = games.where("bgg_id LIKE 'J%'").count
puts "J形式の手動登録: #{manual_games}件"

# その他の形式
other_games = games.where.not("bgg_id ~ '^[0-9]+$'").where.not("bgg_id LIKE 'J%'").count
puts "その他の形式: #{other_games}件"

if other_games > 0
  puts
  puts "=== その他の形式の詳細 ==="
  games.where.not("bgg_id ~ '^[0-9]+$'").where.not("bgg_id LIKE 'J%'").each do |game|
    puts "ID: #{game.bgg_id}, 名前: #{game.name || game.japanese_name}"
  end
end 