namespace :reviews do
  desc "システムレビューがないゲームにシステムレビューを追加する"
  task process_skipped_games: :environment do
    puts "システムレビューがないゲームの処理を開始します..."
    
    # システムユーザーを確認
    system_user = User.find_by(email: 'system@boardgamereview.com')
    if system_user.nil?
      puts "システムユーザーが見つかりません。タスクを中止します。"
      exit
    end
    
    puts "システムユーザー: #{system_user.email} (ID: #{system_user.id})"
    
    # システムレビューがないゲームを取得
    total_games = Game.count
    games_without_reviews = Game.all.select do |game|
      !game.reviews.where(user: system_user).exists?
    end
    
    puts "合計#{total_games}件のゲームを確認しました"
    puts "システムレビューがないゲーム: #{games_without_reviews.size}件"
    
    # 統計情報の初期化
    success_count = 0
    error_count = 0
    
    # エラーが発生したゲームを記録
    error_games = []
    
    # 処理するゲーム数を制限（負荷対策）
    limit = ENV['LIMIT'] ? ENV['LIMIT'].to_i : 50
    games_to_process = games_without_reviews.take(limit)
    
    puts "処理対象: #{games_to_process.size}件（制限: #{limit}件）"
    
    # ゲームを処理
    games_to_process.each_with_index do |game, index|
      begin
        puts "#{index + 1}/#{games_to_process.size}: ゲーム「#{game.name}」(#{game.bgg_id})を処理中..."
        
        # システムレビューを追加
        result = game.update_system_reviews
        
        if result
          # 更新後のレビュー数を確認
          new_reviews = game.reviews.where(user: system_user).count
          puts "  - 成功: レビュー追加数 #{new_reviews}件"
          success_count += 1
        else
          puts "  - 更新に失敗しました"
          error_count += 1
          error_games << { id: game.bgg_id, name: game.name }
        end
        
        # BGG APIへの負荷軽減のため少し待機
        sleep(2)
      rescue => e
        puts "  - エラー: #{e.message}"
        error_count += 1
        error_games << { id: game.bgg_id, name: game.name, error: e.message }
      end
      
      # 進捗状況
      if (index + 1) % 10 == 0 || (index + 1) == games_to_process.size
        puts "進捗: #{index + 1}/#{games_to_process.size} (#{((index + 1).to_f / games_to_process.size * 100).round(1)}%)"
      end
    end
    
    # 結果の表示
    puts "\n====== 処理結果 ======="
    puts "処理対象: #{games_to_process.size}件"
    puts "成功: #{success_count}件"
    puts "エラー: #{error_count}件"
    
    if error_games.any?
      puts "\nエラーが発生したゲーム:"
      error_games.each do |game|
        puts "- #{game[:name]} (#{game[:id]})"
        puts "  エラー: #{game[:error]}" if game[:error]
      end
    end
  end
end 