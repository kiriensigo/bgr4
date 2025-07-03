namespace :games do
  desc "日本語名がないゲームに対してBGGから日本語版情報を取得し、日本語名を更新する"
  task update_japanese_names: :environment do
    puts "🎌 日本語名の更新を開始します..."
    
    # 日本語名がないゲームを取得
    games_without_japanese_names = Game.where(japanese_name: [nil, ''])
    puts "日本語名がないゲーム数: #{games_without_japanese_names.count}"
    
    # 統計情報
    updated_count = 0
    failed_count = 0
    skipped_count = 0
    
    # 各ゲームについて処理
    games_without_japanese_names.find_each(batch_size: 10) do |game|
      begin
        puts "\n🎮 処理中: #{game.name} (BGG ID: #{game.bgg_id})"
        
        # 手動登録ゲーム（jp-で始まるID）はスキップ
        if game.bgg_id.to_s.start_with?('jp-')
          puts "  ⏭️  手動登録ゲーム - スキップ"
          skipped_count += 1
          next
        end
        
        # BGGから日本語版情報を取得
        japanese_info = BggService.get_japanese_version_info(game.bgg_id)
        
        if japanese_info && japanese_info[:name].present?
          # 中国語判定
          if LanguageDetectionService.chinese?(japanese_info[:name])
            puts "  🇨🇳 中国語と判定されたため、スキップ: #{japanese_info[:name]}"
            skipped_count += 1
            next
          end
          
          # 日本語名を更新
          old_name = game.japanese_name
          game.update!(
            japanese_name: japanese_info[:name],
            japanese_publisher: japanese_info[:publisher],
            japanese_release_date: japanese_info[:release_date],
            japanese_image_url: japanese_info[:image_url]
          )
          
          puts "  ✅ 更新成功!"
          puts "     日本語名: #{japanese_info[:name]}"
          puts "     日本語版出版社: #{japanese_info[:publisher]}" if japanese_info[:publisher].present?
          puts "     日本語版発売日: #{japanese_info[:release_date]}" if japanese_info[:release_date].present?
          puts "     日本語版画像URL: #{japanese_info[:image_url]}" if japanese_info[:image_url].present?
          
          updated_count += 1
        else
          puts "  ❌ 日本語版情報が見つかりません"
          failed_count += 1
        end
        
        # APIレート制限対策
        sleep(1)
        
      rescue => e
        puts "  💥 エラーが発生しました: #{e.message}"
        puts "     #{e.backtrace.first}"
        failed_count += 1
        
        # 重要なエラーの場合は少し待つ
        sleep(2)
      end
    end
    
    puts "\n🎌 日本語名の更新が完了しました!"
    puts "更新成功: #{updated_count}件"
    puts "失敗: #{failed_count}件"
    puts "スキップ: #{skipped_count}件"
    puts "合計処理: #{updated_count + failed_count + skipped_count}件"
  end
  
  desc "特定のゲームの日本語名を更新する"
  task :update_japanese_name, [:bgg_id] => :environment do |t, args|
    bgg_id = args[:bgg_id]
    
    if bgg_id.blank?
      puts "使用方法: rake games:update_japanese_name[BGG_ID]"
      puts "例: rake games:update_japanese_name[174430]"
      exit
    end
    
    game = Game.find_by(bgg_id: bgg_id)
    
    if game.nil?
      puts "BGG ID #{bgg_id} のゲームが見つかりません"
      exit
    end
    
    puts "🎮 ゲーム: #{game.name} (BGG ID: #{game.bgg_id})"
    puts "現在の日本語名: #{game.japanese_name || '(なし)'}"
    
    begin
      # BGGから日本語版情報を取得
      japanese_info = BggService.get_japanese_version_info(game.bgg_id)
      
      if japanese_info && japanese_info[:name].present?
        # 中国語判定
        if LanguageDetectionService.chinese?(japanese_info[:name])
          puts "🇨🇳 中国語と判定されたため、更新をスキップしました: #{japanese_info[:name]}"
          exit
        end
        
        # 日本語名を更新
        game.update!(
          japanese_name: japanese_info[:name],
          japanese_publisher: japanese_info[:publisher],
          japanese_release_date: japanese_info[:release_date],
          japanese_image_url: japanese_info[:image_url]
        )
        
        puts "✅ 更新成功!"
        puts "新しい日本語名: #{japanese_info[:name]}"
        puts "日本語版出版社: #{japanese_info[:publisher]}" if japanese_info[:publisher].present?
        puts "日本語版発売日: #{japanese_info[:release_date]}" if japanese_info[:release_date].present?
        puts "日本語版画像URL: #{japanese_info[:image_url]}" if japanese_info[:image_url].present?
      else
        puts "❌ 日本語版情報が見つかりませんでした"
      end
      
    rescue => e
      puts "💥 エラーが発生しました: #{e.message}"
      puts "#{e.backtrace.first}"
    end
  end
  
  desc "日本語名の統計情報を表示する"
  task japanese_names_stats: :environment do
    total_games = Game.count
    games_with_japanese_names = Game.where.not(japanese_name: [nil, '']).count
    games_without_japanese_names = total_games - games_with_japanese_names
    
    puts "📊 日本語名の統計情報"
    puts "=" * 40
    puts "総ゲーム数: #{total_games}"
    puts "日本語名あり: #{games_with_japanese_names} (#{(games_with_japanese_names.to_f / total_games * 100).round(1)}%)"
    puts "日本語名なし: #{games_without_japanese_names} (#{(games_without_japanese_names.to_f / total_games * 100).round(1)}%)"
    
    # 日本語名がないゲームの例を表示
    if games_without_japanese_names > 0
      puts "\n日本語名がないゲームの例:"
      Game.where(japanese_name: [nil, '']).limit(10).each do |game|
        puts "- #{game.name} (BGG ID: #{game.bgg_id})"
      end
    end
  end
end 