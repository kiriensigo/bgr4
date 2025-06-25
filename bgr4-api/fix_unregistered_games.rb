puts "=== 未登録ゲーム修正スクリプト ==="

# 未登録ゲームを取得
unregistered_games = Game.where(registered_on_site: false)

puts "未登録ゲーム数: #{unregistered_games.count}"
puts ""

if unregistered_games.count == 0
  puts "未登録ゲームはありません。"
  exit
end

puts "=== 修正対象ゲーム ==="
unregistered_games.order(created_at: :desc).each_with_index do |game, index|
  puts "#{index + 1}. #{game.japanese_name || game.name} (BGG ID: #{game.bgg_id})"
end

puts ""
puts "=== 一括修正開始 ==="

# 一括でregistered_on_site: trueに変更
updated_count = unregistered_games.update_all(registered_on_site: true)

puts "修正完了: #{updated_count}件のゲームを登録済みに変更しました"

# 各ゲームの平均値計算とプレイ人数推奨設定を実行
puts ""
puts "=== 初期設定処理開始 ==="
unregistered_games.each_with_index do |game, index|
  puts "#{index + 1}/#{unregistered_games.count}: #{game.japanese_name || game.name}"
  
  # ゲームをリロード（registered_on_site: trueの状態で）
  game.reload
  
  # 平均値計算とプレイ人数推奨設定
  game.update_average_values
  game.update_site_recommended_players
  
  puts "  ✓ 完了"
end

puts ""
puts "=== 修正結果確認 ==="
puts "総ゲーム数: #{Game.count}"
puts "登録済みゲーム数: #{Game.where(registered_on_site: true).count}"
puts "未登録ゲーム数: #{Game.where(registered_on_site: false).count}"

puts ""
puts "✅ 未登録ゲーム修正が完了しました！" 