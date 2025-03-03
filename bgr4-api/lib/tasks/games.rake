namespace :games do
  desc "BGG APIから日本語名を取得して更新する"
  task update_japanese_names: :environment do
    puts "BGG APIから日本語名を取得して更新します..."
    
    # 日本語名が設定されていないゲームを取得
    games_to_update = Game.where(japanese_name: [nil, ""]).or(Game.where("japanese_name LIKE ?", "%:%"))
    total = games_to_update.count
    
    puts "更新対象のゲーム数: #{total}"
    
    # 一度に処理するゲーム数（BGG APIの制限を考慮）
    batch_size = 10
    
    games_to_update.find_each.with_index do |game, index|
      begin
        puts "[#{index + 1}/#{total}] #{game.name} (BGG ID: #{game.bgg_id}) の日本語名を取得中..."
        
        # BGG APIから詳細情報を取得
        game_details = BggService.get_game_details(game.bgg_id).first
        
        if game_details && game_details[:japanese_name].present?
          old_name = game.japanese_name
          game.update(japanese_name: game_details[:japanese_name])
          
          puts "  ✓ 日本語名を更新しました: #{old_name} → #{game.japanese_name}"
        else
          puts "  × 日本語名が見つかりませんでした"
        end
        
        # BGG APIの負荷を軽減するために少し待機
        if (index + 1) % batch_size == 0
          puts "APIの負荷軽減のために5秒待機します..."
          sleep 5
        end
      rescue => e
        puts "  ! エラーが発生しました: #{e.message}"
      end
    end
    
    puts "日本語名の更新が完了しました"
  end

  desc "既存のゲームデータに対して日本語の説明文を追加"
  task add_japanese_descriptions: :environment do
    puts "日本語の説明文を追加中..."
    
    # 日本語の説明文がないゲームを取得
    games = Game.where(japanese_description: nil).where.not(description: nil)
    total = games.count
    
    puts "処理対象ゲーム数: #{total}"
    
    games.each_with_index do |game, index|
      puts "処理中: #{index + 1}/#{total} - #{game.name} (#{game.bgg_id})"
      
      begin
        # 説明文に日本語が含まれているかチェック
        if game.description.match?(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
          # 既に日本語が含まれている場合はそのまま使用
          game.update(japanese_description: game.description)
          puts "  既に日本語の説明文が含まれています。そのまま使用します。"
        else
          # 日本語が含まれていない場合は翻訳を試みる
          japanese_description = TranslationService.translate_game_description(game.description)
          
          if japanese_description.present?
            game.update(japanese_description: japanese_description)
            puts "  翻訳完了"
          else
            puts "  翻訳に失敗しました"
          end
        end
      rescue => e
        puts "  エラー: #{e.message}"
      end
      
      # APIの制限を考慮して少し待機
      sleep(1)
    end
    
    puts "完了しました！"
  end
end 