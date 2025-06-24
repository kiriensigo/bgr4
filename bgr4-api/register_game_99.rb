puts "=== BGG ID 99 のゲームを登録中 ==="

# BGG API でゲーム情報を確認
begin
  game_info = BggService.get_game_details('99')
  
  if game_info
    puts "BGG ID 99 のゲーム情報を発見:"
    puts "  名前: #{game_info[:name]}"
    puts "  説明: #{game_info[:description]&.slice(0, 100)}..."
    puts "  プレイ人数: #{game_info[:min_players]}-#{game_info[:max_players]}"
    puts "  プレイ時間: #{game_info[:play_time]}分"
    puts "  BGGスコア: #{game_info[:average_score]}"
    
    # ゲームを作成
    game = Game.new(
      bgg_id: '99',
      name: game_info[:name],
      description: game_info[:description],
      image_url: game_info[:image_url],
      min_players: game_info[:min_players],
      max_players: game_info[:max_players],
      play_time: game_info[:play_time],
      min_play_time: game_info[:min_play_time],
      bgg_score: game_info[:average_score],
      weight: game_info[:weight],
      publisher: game_info[:publisher],
      designer: game_info[:designer],
      release_date: game_info[:release_date]
    )
    
    if game.save
      puts "✅ ゲームが正常に登録されました!"
      puts "  ID: #{game.bgg_id}"
      puts "  名前: #{game.name}"
      
      # システムレビューを作成
      puts "\n=== システムレビューを作成中 ==="
      
      # システムユーザーを取得または作成
      system_user = User.find_or_create_by(email: 'system@boardgamereview.com') do |user|
        user.name = 'BoardGameGeek'
        user.password = SecureRandom.hex(16)
        user.confirmed_at = Time.current
      end
      
      # 10件のシステムレビューを作成
      10.times do |i|
        review = Review.new(
          user: system_user,
          game: game,
          overall_rating: (game_info[:average_score] || 7.0).round(1),
          complexity_rating: (game_info[:weight] || 2.5).to_i.clamp(1, 5),
          luck_rating: rand(2..4),
          interaction_rating: rand(3..5),
          downtime_rating: rand(2..4),
          comment: "BGG データに基づくシステムレビュー",
          recommended_players: [game_info[:min_players], game_info[:max_players]].compact.join(',')
        )
        
        if review.save
          puts "  システムレビュー #{i + 1}/10 作成完了"
        else
          puts "  システムレビュー #{i + 1}/10 作成失敗: #{review.errors.full_messages}"
        end
      end
      
      puts "\n✅ BGG ID 99 のゲーム登録が完了しました！"
    else
      puts "❌ ゲームの保存に失敗しました: #{game.errors.full_messages}"
    end
  else
    puts "❌ BGG ID 99 のゲーム情報が見つかりませんでした"
  end
rescue => e
  puts "❌ エラーが発生しました: #{e.message}"
  puts e.backtrace.first(5)
end 