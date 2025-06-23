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

  desc "中国語の日本語名をクリアする"
  task clear_chinese_names: :environment do
    puts "中国語の日本語名をクリアします..."
    
    # 日本語名が設定されているゲームを取得
    games_with_japanese_names = Game.where.not(japanese_name: [nil, ""])
    total = games_with_japanese_names.count
    cleared_count = 0
    
    puts "チェック対象のゲーム数: #{total}"
    
    games_with_japanese_names.find_each.with_index do |game, index|
      begin
        puts "[#{index + 1}/#{total}] #{game.name} (BGG ID: #{game.bgg_id}) の日本語名をチェック中: #{game.japanese_name}"
        
        # 中国語かどうかを判定
        if LanguageDetectionService.chinese?(game.japanese_name)
          old_name = game.japanese_name
          game.update(japanese_name: nil)
          cleared_count += 1
          
          puts "  ✓ 中国語名をクリアしました: #{old_name}"
        else
          puts "  - 日本語名として保持: #{game.japanese_name}"
        end
      rescue => e
        puts "  ! エラーが発生しました: #{e.message}"
      end
    end
    
    puts "中国語名のクリアが完了しました。クリアしたゲーム数: #{cleared_count}"
  end

  desc "日本語名を再取得する（中国語除外機能付き）"
  task refresh_japanese_names: :environment do
    puts "日本語名を再取得します（中国語除外機能付き）..."
    
    # 全てのゲームの日本語名をクリアしてから再取得
    Game.update_all(japanese_name: nil)
    puts "全ての日本語名をクリアしました"
    
    # 日本語名を再取得
    Rake::Task["games:update_japanese_names"].invoke
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

  desc "BGGからゲームのカテゴリとメカニクスを取得して更新する"
  task update_categories_and_mechanics: :environment do
    puts "BGGからゲームのカテゴリとメカニクスを取得して更新します..."
    
    # 全ゲームを取得
    games = Game.all
    total = games.count
    updated = 0
    failed = 0
    
    games.each_with_index do |game, index|
      begin
        puts "#{index + 1}/#{total}: #{game.name} (BGG ID: #{game.bgg_id}) を処理中..."
        
        # BGGからゲーム情報を取得
        bgg_game_info = BggService.get_game_details(game.bgg_id)
        
        if bgg_game_info.nil?
          puts "  BGGからゲーム情報を取得できませんでした"
          failed += 1
          next
        end
        
        # カテゴリとメカニクスを更新
        game.categories = bgg_game_info[:categories]
        game.mechanics = bgg_game_info[:mechanics]
        
        if game.save
          puts "  更新成功: カテゴリ #{game.categories&.size || 0}件, メカニクス #{game.mechanics&.size || 0}件"
          updated += 1
        else
          puts "  更新失敗: #{game.errors.full_messages.join(', ')}"
          failed += 1
        end
        
        # BGGのAPIに負荷をかけないよう少し待機
        sleep 1
      rescue => e
        puts "  エラー: #{e.message}"
        failed += 1
      end
    end
    
    puts "処理完了: 全#{total}件中、#{updated}件更新成功、#{failed}件失敗"
  end

  desc "既存のゲーム情報をBGGから再取得して更新する"
  task refresh_from_bgg: :environment do
    puts "既存のゲーム情報をBGGから再取得して更新します..."
    
    games = Game.all
    total = games.count
    
    games.each_with_index do |game, index|
      puts "#{index+1}/#{total}: #{game.name} (BGG ID: #{game.bgg_id}) を処理中..."
      
      begin
        # BGGからゲーム情報を取得
        game_details = BggService.get_game_details(game.bgg_id)
        
        if game_details
          # 更新するフィールドを準備
          update_attrs = {
            description: game_details[:description],
            min_play_time: game_details[:min_play_time],
            weight: game_details[:weight],
            publisher: game_details[:publisher],
            designer: game_details[:designer],
            release_date: game_details[:release_date],
            best_num_players: game_details[:best_num_players],
            recommended_num_players: game_details[:recommended_num_players],
            categories: game_details[:categories],
            mechanics: game_details[:mechanics]
          }
          
          # 更新前の値を保存
          old_values = {}
          update_attrs.each do |key, value|
            old_values[key] = game.send(key) if game.respond_to?(key)
          end
          
          # 更新を実行
          if game.update(update_attrs)
            # 変更があったフィールドを表示
            changes = []
            update_attrs.each do |key, new_value|
              old_value = old_values[key]
              if old_value != new_value && !new_value.nil?
                changes << "#{key}: #{old_value.inspect} → #{new_value.inspect}"
              end
            end
            
            if changes.any?
              puts "  更新成功: #{changes.join(', ')}"
            else
              puts "  変更なし"
            end
          else
            puts "  更新失敗: #{game.errors.full_messages.join(', ')}"
          end
        else
          puts "  BGGからの情報取得に失敗しました"
        end
        
        # APIリクエスト間の間隔を空ける（BGG APIの制限を考慮）
        sleep 1
      rescue => e
        puts "  エラー発生: #{e.message}"
      end
    end
    
    puts "処理完了: 全#{total}件"
  end
end 