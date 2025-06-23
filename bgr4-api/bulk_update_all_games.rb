# すべてのゲームに新しいプレイ人数計算システムを適用

puts "=== 全ゲーム一括更新：新しいプレイ人数計算システム ==="

# 処理対象のゲーム数を確認
total_games = Game.count
puts "処理対象のゲーム数: #{total_games}件"

if total_games == 0
  puts "処理対象のゲームがありません"
  exit
end

puts "\n処理を開始します..."
puts "※ 大量のBGG APIアクセスが発生するため、時間がかかる場合があります"

# 処理統計
processed_count = 0
success_count = 0
error_count = 0
skipped_count = 0

# バッチサイズ（メモリ効率のため）
batch_size = 10

Game.find_in_batches(batch_size: batch_size) do |games_batch|
  puts "\n--- バッチ処理中 (#{processed_count + 1} - #{processed_count + games_batch.size}) ---"
  
  games_batch.each_with_index do |game, index|
    processed_count += 1
    
    begin
      puts "\n[#{processed_count}/#{total_games}] #{game.name} (BGG: #{game.bgg_id})"
      
      # BGG情報がない場合はBGGから取得を試みる
      if game.best_num_players.blank? && game.recommended_num_players.blank?
        puts "  BGG情報を取得中..."
        
        begin
          bgg_game_info = BggService.get_game_details(game.bgg_id)
          
          if bgg_game_info && (bgg_game_info[:best_num_players] || bgg_game_info[:recommended_num_players])
            game.best_num_players = bgg_game_info[:best_num_players] || []
            game.recommended_num_players = bgg_game_info[:recommended_num_players] || []
            game.save!
            puts "  BGG情報を更新: Best=#{game.best_num_players}, Recommended=#{game.recommended_num_players}"
          else
            puts "  BGG情報の取得に失敗またはデータなし"
          end
          
          # API制限を考慮して待機
          sleep(1.2)
          
        rescue => e
          puts "  BGG情報取得エラー: #{e.message}"
        end
      else
        puts "  BGG情報は既に設定済み"
      end
      
      # プレイ人数計算を実行
      puts "  プレイ人数計算を実行中..."
      UpdateGamePopularFeaturesJob.perform_now(game.bgg_id)
      
      success_count += 1
      puts "  ✅ 完了"
      
    rescue => e
      error_count += 1
      puts "  ❌ エラー: #{e.message}"
      
      # 致命的エラーの場合は処理を停止
      if e.message.include?("connection") || e.message.include?("database")
        puts "\n💥 致命的エラーが発生しました。処理を停止します。"
        break
      end
    end
  end
  
  # バッチ間で少し待機
  puts "\nバッチ処理完了。次のバッチまで少し待機します..."
  sleep(2)
end

# 処理結果のサマリー
puts "\n" + "="*50
puts "🏁 一括処理完了！"
puts "="*50
puts "処理対象: #{total_games}件"
puts "処理済み: #{processed_count}件"
puts "成功: #{success_count}件"
puts "エラー: #{error_count}件"
puts "スキップ: #{skipped_count}件"

if success_count > 0
  success_rate = (success_count.to_f / processed_count * 100).round(1)
  puts "\n✅ 成功率: #{success_rate}%"
end

if error_count > 0
  puts "\n⚠️  エラーが発生したゲームがあります。"
  puts "個別に確認が必要な可能性があります。"
end

puts "\n🎯 新しいプレイ人数計算システムの適用が完了しました！" 