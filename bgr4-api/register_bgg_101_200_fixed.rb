#!/usr/bin/env ruby

require_relative 'config/environment'

puts '=== BGG 101-200番のゲーム登録 ==='
start_time = Time.now
success_count = 0
skip_count = 0
error_count = 0

# 既存のゲームIDを取得
existing_ids = Game.where(bgg_id: 101..200).pluck(:bgg_id)
puts "既存ゲーム数: #{existing_ids.count}"

# 未登録のIDを特定
missing_ids = (101..200).to_a - existing_ids
puts "未登録ゲーム数: #{missing_ids.count}"

if missing_ids.empty?
  puts "全てのゲームが既に登録済みです！"
  exit
end

puts "登録開始: #{missing_ids.first} から #{missing_ids.last} まで"
puts "=" * 50

missing_ids.each_with_index do |bgg_id, index|
  begin
    print "[#{index + 1}/#{missing_ids.count}] BGG ID #{bgg_id} を処理中..."
    
    # BggService.get_game_detailsを使用してゲーム情報を取得
    game_data = BggService.get_game_details(bgg_id.to_s)
    
    if game_data && game_data[:name]
      # ゲームを作成（正しいカラム名を使用）
      game = Game.create!(
        bgg_id: bgg_id,
        name: game_data[:name],
        japanese_name: game_data[:japanese_name],
        description: game_data[:description],
        min_players: game_data[:min_players],
        max_players: game_data[:max_players],
        play_time: game_data[:play_time],
        min_play_time: game_data[:min_play_time],
        release_date: game_data[:year_published] ? Date.new(game_data[:year_published], 1, 1) : nil,
        bgg_score: game_data[:average_score] || game_data[:bgg_score],
        bgg_complexity: game_data[:weight] || game_data[:bgg_complexity],
        image_url: game_data[:image_url],
        thumbnail_url: game_data[:thumbnail_url],
        metadata: game_data[:metadata] || {}
      )
      
      # 平均値を更新
      UpdateGameAverageValuesJob.perform_now(game.id)
      
      puts " ✅ 完了 (#{game.name})"
      success_count += 1
    else
      puts " ⚠️ スキップ - データなし"
      skip_count += 1
    end
    
    # BGG APIへの負荷軽減（1秒待機）
    sleep(1)
    
  rescue => e
    puts " ❌ エラー: #{e.message}"
    error_count += 1
    next
  end
  
  # 10件ごとに進捗表示
  if (index + 1) % 10 == 0
    puts "--- 進捗: #{index + 1}/#{missing_ids.count} 完了 ---"
  end
end

end_time = Time.now
puts "\n" + "=" * 50
puts "=== 登録完了！ ==="
puts "処理時間: #{(end_time - start_time).round(2)}秒"
puts "成功: #{success_count}件"
puts "スキップ: #{skip_count}件"
puts "エラー: #{error_count}件"
puts "現在の総ゲーム数: #{Game.count}"
puts "BGG 101-200範囲: #{Game.where(bgg_id: 101..200).count}/100件" 