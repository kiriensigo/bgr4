#!/usr/bin/env ruby

puts 'BGG 101-200番のゲーム登録を開始します...'
start_time = Time.now
success_count = 0
skip_count = 0
error_count = 0

(101..200).each do |bgg_id|
  begin
    print "BGG ID #{bgg_id} を処理中..."
    
    # 既存チェック
    if Game.exists?(bgg_id: bgg_id)
      puts ' [既存]'
      skip_count += 1
      next
    end
    
    # BGGからゲーム情報を取得
    game_service = Bgg::GameService.new
    game_data = game_service.get_game_by_id(bgg_id)
    
    if game_data && game_data[:name]
      # ゲームを作成
      game = Game.create!(
        bgg_id: bgg_id,
        name: game_data[:name],
        japanese_name: game_data[:japanese_name],
        description: game_data[:description],
        min_players: game_data[:min_players],
        max_players: game_data[:max_players],
        playing_time: game_data[:playing_time],
        min_age: game_data[:min_age],
        year_published: game_data[:year_published],
        bgg_score: game_data[:bgg_score],
        bgg_complexity: game_data[:bgg_complexity],
        image_url: game_data[:image_url],
        thumbnail_url: game_data[:thumbnail_url],
        metadata: game_data[:metadata] || {}
      )
      
      # 平均値を更新
      UpdateGameAverageValuesJob.perform_now(game.id)
      
      puts ' [完了]'
      success_count += 1
    else
      puts ' [スキップ - データなし]'
      skip_count += 1
    end
    
    # BGG APIへの負荷軽減（0.5秒待機）
    sleep(0.5)
    
  rescue => e
    puts " [エラー: #{e.message}]"
    error_count += 1
    next
  end
end

end_time = Time.now
puts "\n=== 登録完了！ ==="
puts "処理時間: #{(end_time - start_time).round(2)}秒"
puts "成功: #{success_count}件"
puts "スキップ: #{skip_count}件"
puts "エラー: #{error_count}件"
puts "現在の総ゲーム数: #{Game.count}" 