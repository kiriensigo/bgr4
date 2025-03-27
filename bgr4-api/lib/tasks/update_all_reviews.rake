namespace :reviews do
  desc "全てのゲームのシステムレビューを更新する"
  task update_all_system_reviews: :environment do
    puts "全てのゲームのシステムレビューを更新します..."
    
    # システムユーザーを確認
    system_user = User.find_by(email: 'system@boardgamereview.com')
    if system_user.nil?
      puts "システムユーザーが見つかりません。タスクを中止します。"
      exit
    end
    
    puts "システムユーザーを見つけました: #{system_user.email}"
    
    # ゲーム数を取得
    total_games = Game.count
    puts "合計#{total_games}件のゲームを処理します"
    
    # 統計情報
    success_count = 0
    error_count = 0
    skip_count = 0
    
    # エラーが発生したゲームを記録
    error_games = []
    
    # すべてのゲームを処理
    Game.find_each.with_index(1) do |game, index|
      begin
        puts "#{index}/#{total_games}: ゲーム「#{game.name}」(#{game.bgg_id})を処理中..."
        
        # 既存のシステムレビューを確認
        existing_reviews = game.reviews.where(user: system_user).count
        
        if existing_reviews > 0
          puts "  - 既存のシステムレビュー: #{existing_reviews}件"
          
          # システムレビューを更新
          result = game.update_system_reviews
          
          if result
            # 更新後のレビュー数を確認
            new_reviews = game.reviews.where(user: system_user).count
            puts "  - 成功: レビュー数 #{existing_reviews} -> #{new_reviews}"
            success_count += 1
          else
            puts "  - 更新に失敗しました"
            error_count += 1
            error_games << { id: game.bgg_id, name: game.name }
          end
        else
          puts "  - システムレビューなし、スキップします"
          skip_count += 1
        end
      rescue => e
        puts "  - エラー: #{e.message}"
        error_count += 1
        error_games << { id: game.bgg_id, name: game.name, error: e.message }
      end
      
      # 進捗状況
      if index % 10 == 0 || index == total_games
        puts "進捗: #{index}/#{total_games} (#{(index.to_f / total_games * 100).round(1)}%)"
      end
    end
    
    # 結果の表示
    puts "\n====== 処理結果 ======="
    puts "成功: #{success_count}件"
    puts "エラー: #{error_count}件"
    puts "スキップ: #{skip_count}件"
    
    if error_games.any?
      puts "\nエラーが発生したゲーム:"
      error_games.each do |game|
        puts "- #{game[:name]} (#{game[:id]})"
        puts "  エラー: #{game[:error]}" if game[:error]
      end
    end
  end
end 