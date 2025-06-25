puts "=== 未登録ゲームの詳細分析 ==="

# 未登録ゲームを取得
unregistered_games = Game.where(registered_on_site: false).order(created_at: :desc).limit(5)

puts "未登録ゲーム数: #{Game.where(registered_on_site: false).count}"
puts ""

unregistered_games.each_with_index do |game, index|
  puts "#{index + 1}. #{game.japanese_name || game.name}"
  puts "   BGG ID: #{game.bgg_id}"
  puts "   作成日時: #{game.created_at}"
  puts "   BGGスコア: #{game.bgg_score}"
  puts "   説明: #{game.description.present? ? '設定済み' : '未設定'}"
  puts "   画像URL: #{game.image_url.present? ? '設定済み' : '未設定'}"
  puts "   プレイヤー数: #{game.min_players}-#{game.max_players}"
  puts "   プレイ時間: #{game.play_time}"
  puts "   出版社: #{game.publisher || '未設定'}"
  puts "   日本語出版社: #{game.japanese_publisher || '未設定'}"
  puts "   ------------------------"
end

puts ""
puts "=== 登録処理の確認 ==="

# ゲーム登録時の処理を確認
puts "最新の登録済みゲーム:"
latest_registered = Game.where(registered_on_site: true).order(created_at: :desc).first
if latest_registered
  puts "名前: #{latest_registered.japanese_name || latest_registered.name}"
  puts "作成日時: #{latest_registered.created_at}"
  puts "BGG ID: #{latest_registered.bgg_id}"
end

puts ""
puts "最新の未登録ゲーム:"
latest_unregistered = Game.where(registered_on_site: false).order(created_at: :desc).first
if latest_unregistered
  puts "名前: #{latest_unregistered.japanese_name || latest_unregistered.name}"
  puts "作成日時: #{latest_unregistered.created_at}"
  puts "BGG ID: #{latest_unregistered.bgg_id}"
end

puts ""
puts "=== 時系列での登録状況 ==="
recent_games = Game.order(created_at: :desc).limit(10)
recent_games.each_with_index do |game, index|
  status = game.registered_on_site ? "✅登録済み" : "❌未登録"
  puts "#{index + 1}. #{game.created_at.strftime('%H:%M')} - #{game.japanese_name || game.name} - #{status}"
end 