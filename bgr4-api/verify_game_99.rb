game = Game.find_by(bgg_id: '99')
if game
  puts "✅ BGG ID 99 のゲームが正常に登録されています！"
  puts "  名前: #{game.name}"
  puts "  プレイ人数: #{game.min_players}-#{game.max_players}人"
  puts "  プレイ時間: #{game.play_time}分"
  puts "  BGGスコア: #{game.bgg_score}"
  puts "  システムレビュー数: #{game.reviews.count}件"
else
  puts "❌ BGG ID 99 のゲームが見つかりません"
end 