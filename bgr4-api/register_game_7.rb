puts "=== BGG ID 7 のゲームを登録中 ==="

# BGG API でゲーム情報を確認
begin
  game_info = BggService.get_game_details('7')
  
  if game_info
    puts "BGG ID 7 のゲーム情報を発見:"
    puts "  名前: #{game_info[:name]}"
    puts "  説明: #{game_info[:description]&.slice(0, 100)}..."
    puts "  プレイ人数: #{game_info[:min_players]}-#{game_info[:max_players]}"
    puts "  プレイ時間: #{game_info[:play_time]}分"
    puts "  BGGスコア: #{game_info[:average_score]}"
    
    # ゲームを作成
    game = Game.new(
      bgg_id: '7',
      name: game_info[:name],
      description: game_info[:description],
      image_url: game_info[:image_url],
      min_players: game_info[:min_players],
      max_players: game_info[:max_players],
      play_time: game_info[:play_time],
      bgg_score: game_info[:average_score],
      weight: game_info[:weight],
      publisher: game_info[:publisher],
      designer: game_info[:designer],
      release_date: game_info[:release_date],
      registered_on_site: true
    )
    
    if game.save
      puts "✅ ゲーム ID 7 を正常に登録しました！"
      puts "   - 名前: #{game.name}"
      puts "   - BGG ID: #{game.bgg_id}"
      
      # システムレビューを作成
      puts "📝 システムレビューを作成中..."
      game.create_initial_reviews
      puts "✅ システムレビューの作成が完了しました"
    else
      puts "❌ ゲームの登録に失敗しました:"
      game.errors.full_messages.each { |msg| puts "   - #{msg}" }
    end
  else
    puts "❌ BGG ID 7 のゲーム情報を取得できませんでした"
  end
rescue => e
  puts "❌ エラーが発生しました: #{e.message}"
  puts e.backtrace.first(5)
end 