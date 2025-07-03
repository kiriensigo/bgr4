namespace :data do
  desc "Import games from JSON export file"
  task :import_from_file, [:filepath] => :environment do |task, args|
    filepath = args[:filepath]
    
    unless filepath
      puts "❌ Error: ファイルパスが指定されていません"
      puts "使用例: bundle exec rake data:import_from_file[tmp/games_export_20250703_195219.json]"
      exit 1
    end
    
    unless File.exist?(filepath)
      puts "❌ Error: ファイルが見つかりません: #{filepath}"
      exit 1
    end
    
    puts "📂 ファイルを読み込み中: #{filepath}"
    
    begin
      file_content = File.read(filepath)
      games_data = JSON.parse(file_content)
      
      puts "📊 インポート対象: #{games_data.length}件のゲーム"
      puts "🔄 インポート開始..."
      
      imported_count = 0
      skipped_count = 0
      error_count = 0
      
      games_data.each_with_index do |game_data, index|
        begin
          # システムユーザーを取得
          system_user = User.find_by(email: 'system@boardgamereviews.com')
          unless system_user
            puts "❌ Error: システムユーザーが見つかりません"
            exit 1
          end
          
          # 既存ゲームをチェック
          existing_game = Game.find_by(bgg_id: game_data['bgg_id'])
          if existing_game
            puts "⏭️  スキップ: #{game_data['title']} (BGG ID: #{game_data['bgg_id']}) - 既に存在"
            skipped_count += 1
            next
          end
          
          # ゲームを作成
          game = Game.create!(
            title: game_data['title'],
            japanese_name: game_data['japanese_name'],
            bgg_id: game_data['bgg_id'],
            description: game_data['description'],
            japanese_description: game_data['japanese_description'],
            year_published: game_data['year_published'],
            min_players: game_data['min_players'],
            max_players: game_data['max_players'],
            min_playtime: game_data['min_playtime'],
            max_playtime: game_data['max_playtime'],
            min_age: game_data['min_age'],
            complexity: game_data['complexity'],
            bgg_score: game_data['bgg_score'],
            bgg_rank: game_data['bgg_rank'],
            bgg_num_votes: game_data['bgg_num_votes'],
            image_url: game_data['image_url'],
            japanese_image_url: game_data['japanese_image_url'],
            categories: game_data['categories'],
            mechanics: game_data['mechanics'],
            popular_categories: game_data['popular_categories'],
            popular_mechanics: game_data['popular_mechanics'],
            publishers: game_data['publishers'],
            designers: game_data['designers'],
            japanese_publisher: game_data['japanese_publisher'],
            release_date: game_data['release_date'],
            weight: game_data['weight'],
            average_complexity: game_data['average_complexity'],
            average_luck_factor: game_data['average_luck_factor'],
            average_interaction: game_data['average_interaction'],
            average_accessibility: game_data['average_accessibility'],
            average_play_time: game_data['average_play_time'],
            average_score: game_data['average_score'],
            registered_on_site: game_data['registered_on_site'] || false,
            created_at: game_data['created_at'],
            updated_at: game_data['updated_at']
          )
          
          imported_count += 1
          
          if (index + 1) % 100 == 0
            puts "進捗: #{index + 1}/#{games_data.length} (#{((index + 1).to_f / games_data.length * 100).round(1)}%)"
          end
          
        rescue => e
          error_count += 1
          puts "❌ Error importing game #{game_data['title'] || 'Unknown'}: #{e.message}"
          puts "   BGG ID: #{game_data['bgg_id']}"
        end
      end
      
      puts "\n✅ インポート完了!"
      puts "📊 結果統計:"
      puts "   - インポート成功: #{imported_count}件"
      puts "   - スキップ: #{skipped_count}件"
      puts "   - エラー: #{error_count}件"
      puts "   - 総処理件数: #{games_data.length}件"
      
      if error_count > 0
        puts "\n⚠️  エラーが発生したゲームがあります。ログを確認してください。"
      end
      
    rescue JSON::ParserError => e
      puts "❌ Error: JSONファイルの解析に失敗しました: #{e.message}"
      exit 1
    rescue => e
      puts "❌ Error: インポート中にエラーが発生しました: #{e.message}"
      exit 1
    end
  end
end 