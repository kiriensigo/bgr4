#!/usr/bin/env ruby
require_relative 'config/environment'

# テスト用のBGG ID（まだ登録されていないゲーム）
TEST_GAMES = [
  405942,  # Lacuna
  350933,  # Frosthaven
  378119,  # Arcs
  370591,  # John Company: Second Edition
  366013,  # Horseless Carriage
  384577,  # Tiletum
  400573,  # Boonlake: Artifacts
  416421,  # Smartphone Inc. - Update 1.1
  420307,  # Evenfall
  425833   # Rome & Roll: Gladiators
]

puts "=" * 60
puts "🧪 BGG 10ゲーム登録テスト開始"
puts "登録対象ゲーム数: #{TEST_GAMES.size}"
puts "登録前の総ゲーム数: #{Game.count}"
puts "=" * 60

success_count = 0
skip_count = 0
error_count = 0
errors = []

TEST_GAMES.each_with_index do |bgg_id, index|
  begin
    puts "\n[#{index + 1}/#{TEST_GAMES.size}] BGG ID: #{bgg_id} を処理中..."
    
    # 既存ゲームをチェック
    existing_game = Game.find_by(bgg_id: bgg_id)
    if existing_game
      puts "  ✓ 既に登録済み: #{existing_game.japanese_name.presence || existing_game.name}"
      puts "  📝 登録状態: #{existing_game.registered_on_site ? '登録済み' : '未登録'}"
      skip_count += 1
      next
    end
    
    # BGGサービスを使用してゲーム情報を取得
    Rails.logger.info "Fetching game data for BGG ID: #{bgg_id}"
    game_data = BggService.get_game_details(bgg_id)
    
    if game_data && game_data[:name].present?
      puts "  📋 取得したゲーム名: #{game_data[:name]}"
      puts "  📋 日本語名: #{game_data[:japanese_name] || 'なし'}"
      puts "  📋 プレイ人数: #{game_data[:min_players]}-#{game_data[:max_players]}人"
      puts "  📋 プレイ時間: #{game_data[:play_time]}分"
      
      # ゲームを作成（registered_on_site: trueを明示的に設定）
      game_attributes = {
        bgg_id: bgg_id,
        name: game_data[:name],
        japanese_name: game_data[:japanese_name],
        description: game_data[:description],
        japanese_description: game_data[:japanese_description],
        min_players: game_data[:min_players],
        max_players: game_data[:max_players],
        play_time: game_data[:play_time],
        min_play_time: game_data[:min_play_time],
        min_age: game_data[:min_age],
        image_url: game_data[:image_url],
        thumbnail_url: game_data[:thumbnail_url],
        bgg_score: game_data[:average_score],
        weight: game_data[:weight],
        designer: game_data[:designer],
        publisher: game_data[:publisher],
        japanese_publisher: game_data[:japanese_publisher],
        release_date: game_data[:release_date],
        japanese_release_date: game_data[:japanese_release_date],
        registered_on_site: true  # 🔥 重要：明示的にtrueを設定
      }
      
      # nilや空の値を除去
      game_attributes = game_attributes.compact
      
      puts "  🔍 registered_on_site設定: #{game_attributes[:registered_on_site]}"
      
      game = Game.new(game_attributes)
      
      # メタデータを保存
      if game_data[:categories].present?
        game.store_metadata(:categories, game_data[:categories])
      end
      
      if game_data[:mechanics].present?
        game.store_metadata(:mechanics, game_data[:mechanics])
      end
      
      if game_data[:best_num_players].present?
        game.store_metadata(:best_num_players, game_data[:best_num_players])
      end
      
      if game_data[:recommended_num_players].present?
        game.store_metadata(:recommended_num_players, game_data[:recommended_num_players])
      end
      
      if game.save
        puts "  ✅ 登録成功: #{game.japanese_name.presence || game.name}"
        puts "     📊 BGGスコア: #{game.bgg_score || 'なし'}"
        puts "     🎯 登録状態: #{game.registered_on_site ? '登録済み' : '未登録'}"
        puts "     👥 プレイ人数: #{game.min_players}-#{game.max_players}人"
        puts "     ⏱️  プレイ時間: #{game.play_time}分"
        puts "     🎨 デザイナー: #{game.designer || 'なし'}"
        puts "     🏢 出版社: #{game.publisher || 'なし'}"
        
        # 初期設定処理
        game.update_average_values
        game.update_site_recommended_players
        
        success_count += 1
      else
        puts "  ❌ 保存エラー: #{game.errors.full_messages.join(', ')}"
        puts "  🔍 検証詳細:"
        game.errors.full_messages.each do |msg|
          puts "    - #{msg}"
        end
        error_count += 1
        errors << "BGG ID #{bgg_id}: #{game.errors.full_messages.join(', ')}"
      end
    else
      puts "  ❌ BGGからデータを取得できませんでした"
      error_count += 1
      errors << "BGG ID #{bgg_id}: データ取得失敗"
    end
    
    # API制限を考慮して待機
    puts "  ⏱️  3秒待機中..."
    sleep(3)
    
  rescue => e
    puts "  ❌ エラー: #{e.message}"
    puts "  🔍 エラー詳細: #{e.class}"
    Rails.logger.error "Error processing BGG ID #{bgg_id}: #{e.message}\n#{e.backtrace.join("\n")}"
    error_count += 1
    errors << "BGG ID #{bgg_id}: #{e.message}"
    
    sleep(2)
  end
end

puts "\n" + "=" * 60
puts "🎯 BGG 10ゲーム登録テスト完了"
puts "=" * 60
puts "✅ 新規登録: #{success_count}件"
puts "⏭️  既存スキップ: #{skip_count}件"
puts "❌ エラー: #{error_count}件"
puts "📊 合計処理: #{success_count + skip_count + error_count}件"

# 登録後の状況確認
puts "\n📊 登録後の状況:"
total_games = Game.count
registered_games = Game.where(registered_on_site: true).count
unregistered_games = Game.where(registered_on_site: false).count

puts "   総ゲーム数: #{total_games}件"
puts "   登録済み: #{registered_games}件"
puts "   未登録: #{unregistered_games}件"

if success_count > 0
  puts "\n🎮 新規登録されたゲーム:"
  Game.where(bgg_id: TEST_GAMES).where(registered_on_site: true).order(created_at: :desc).each_with_index do |game, index|
    puts "   #{index + 1}. #{game.japanese_name.presence || game.name} (BGG ID: #{game.bgg_id})"
  end
end

if errors.any?
  puts "\n⚠️  エラー詳細:"
  errors.each { |error| puts "  - #{error}" }
end

puts "\n🧪 BGGゲーム登録テストが完了しました！"
puts "📈 新しく#{success_count}件のゲームが追加されました" 