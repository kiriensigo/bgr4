#!/usr/bin/env ruby
# BGG Top3000ゲーム登録スクリプト

require_relative 'config/environment'

puts "🎲 BGG Top3000ゲーム段階的登録開始"
puts "📄 ページ2-5を処理（テスト）"

successful_count = 0
failed_count = 0
skipped_count = 0

(2..5).each do |page|
  puts "\n📖 ページ #{page} 処理中..."
  
  begin
    game_ids = BggService.get_top_games_from_browse(page)
    puts "  ✅ #{game_ids.count}件のゲームIDを取得"
    
    game_ids.first(20).each do |game_id|  # 1ページあたり20件に制限
      # 既存チェック
      if Game.exists?(bgg_id: game_id)
        skipped_count += 1
        next
      end

      begin
        # BGGからゲーム詳細取得
        game_data = BggService.get_game_details(game_id)
        unless game_data
          puts "    ⚠️  ゲーム詳細取得失敗: BGG ID #{game_id}"
          failed_count += 1
          next
        end

        # ゲーム作成（システムレビューなし）
        game = Game.create!(
          bgg_id: game_id,
          name: game_data[:name],
          japanese_name: game_data[:japanese_name],
          description: game_data[:description],
          image_url: game_data[:image_url],
          min_players: game_data[:min_players],
          max_players: game_data[:max_players],
          play_time: game_data[:play_time],
          min_play_time: game_data[:min_play_time],
          weight: game_data[:weight],
          publisher: game_data[:publisher],
          japanese_publisher: game_data[:japanese_publisher],
          designer: game_data[:designer],
          release_date: game_data[:release_date],
          japanese_release_date: game_data[:japanese_release_date],
          registered_on_site: true,
          bgg_score: game_data[:average_score] || 7.5,
          average_score: game_data[:average_score] || 7.5
        )

        puts "    ✅ 登録成功: #{game.name} (BGG ID: #{game_id})"
        successful_count += 1

      rescue => e
        puts "    ❌ 登録失敗: BGG ID #{game_id} - #{e.message}"
        failed_count += 1
      end
      
      sleep 3 # API制限対策
    end
    
  rescue => e
    puts "  ❌ ページ #{page} 処理エラー: #{e.message}"
    failed_count += 1
  end
  
  puts "  ⏱️  ページ間待機（5秒）..."
  sleep 5
  
  # 進行状況表示
  puts "  📊 現在: 成功#{successful_count}件 / スキップ#{skipped_count}件 / 失敗#{failed_count}件"
end

puts "\n🏁 段階的登録完了！"
puts "📊 最終結果:"
puts "  ✅ 成功: #{successful_count}件"
puts "  ⏭️  スキップ: #{skipped_count}件"
puts "  ❌ 失敗: #{failed_count}件"
puts "  📝 総ゲーム数: #{Game.count}件" 