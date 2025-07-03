namespace :data do
  desc "Supabase移行用にゲームデータをエクスポート"
  task export_games: :environment do
    puts "🎮 ゲームデータのエクスポートを開始..."
    
    # エクスポートファイルの作成
    timestamp = Time.current.strftime("%Y%m%d_%H%M%S")
    file_path = "tmp/games_export_#{timestamp}.json"
    
    games_data = []
    total_games = Game.count
    processed = 0
    
    Game.find_each(batch_size: 100) do |game|
      games_data << {
        bgg_id: game.bgg_id,
        name: game.name,
        japanese_name: game.japanese_name,
        description: game.description,
        japanese_description: game.japanese_description,
        image_url: game.image_url,
        japanese_image_url: game.japanese_image_url,
        min_players: game.min_players,
        max_players: game.max_players,
        play_time: game.play_time,
        min_play_time: game.min_play_time,
        max_play_time: game.max_play_time,
        bgg_score: game.bgg_score,
        weight: game.weight,
        complexity: game.complexity,
        publisher: game.publisher,
        japanese_publisher: game.japanese_publisher,
        designer: game.designer,
        release_date: game.release_date,
        japanese_release_date: game.japanese_release_date,
        popular_categories: game.popular_categories,
        popular_mechanics: game.popular_mechanics,
        categories: game.categories,
        mechanics: game.mechanics,
        metadata: game.metadata,
        registered_on_site: game.registered_on_site,
        created_at: game.created_at,
        updated_at: game.updated_at
      }
      
      processed += 1
      print "\r進捗: #{processed}/#{total_games} (#{(processed.to_f / total_games * 100).round(1)}%)"
    end
    
    # JSONファイルに書き出し
    File.open(file_path, 'w') do |file|
      file.write(JSON.pretty_generate({
        export_info: {
          timestamp: timestamp,
          total_games: total_games,
          source_database: "bgr4_development",
          target_database: "supabase"
        },
        games: games_data
      }))
    end
    
    puts "\n✅ エクスポート完了: #{file_path}"
    puts "📊 総ゲーム数: #{total_games}件"
    puts "📦 ファイルサイズ: #{(File.size(file_path) / 1024.0 / 1024.0).round(2)} MB"
  end
  
  desc "Supabase移行用にユーザーデータをエクスポート"
  task export_users: :environment do
    puts "👥 ユーザーデータのエクスポートを開始..."
    
    timestamp = Time.current.strftime("%Y%m%d_%H%M%S")
    file_path = "tmp/users_export_#{timestamp}.json"
    
    users_data = User.all.map do |user|
      {
        name: user.name,
        email: user.email,
        provider: user.provider,
        uid: user.uid,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin,
        bio: user.bio,
        confirmed_at: user.confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    end
    
    File.open(file_path, 'w') do |file|
      file.write(JSON.pretty_generate({
        export_info: {
          timestamp: timestamp,
          total_users: users_data.length
        },
        users: users_data
      }))
    end
    
    puts "✅ ユーザーエクスポート完了: #{file_path}"
    puts "📊 総ユーザー数: #{users_data.length}件"
  end
  
  desc "全データをエクスポート"
  task export_all: [:export_games, :export_users] do
    puts "🎉 全データのエクスポートが完了しました！"
  end
end 