#!/usr/bin/env ruby
require_relative 'config/environment'

# 前回のスクリプトでエラーが発生したゲームのBGG IDリスト
FAILED_GAMES = [
  62219,   # Pandemic
  176494,  # Anachrony
  139030,  # Codenames
  128882,  # Keyflower
  181304,  # Orléans
  317985,  # It's a Wonderful World
  253618,  # Azul: Summer Pavilion
  266830,  # Spirit Island: Jagged Earth
  172386,  # Spirit Island: Branch & Claw
  283155,  # Fireball Island: The Curse of Vul-Kar
  226320,  # My Little Scythe
  300327,  # Barrage
  233398,  # Azul: Stained Glass of Sintra
  148949,  # Azul: Stained Glass of Sintra
  284435,  # Gloomhaven: Forgotten Circles
  168435   # Between Two Cities
]

puts "=" * 60
puts "🔧 BGG 失敗ゲーム再登録スクリプト開始"
puts "登録対象ゲーム数: #{FAILED_GAMES.size}"
puts "=" * 60

success_count = 0
skip_count = 0
error_count = 0
errors = []

FAILED_GAMES.each_with_index do |bgg_id, index|
  begin
    puts "\n[#{index + 1}/#{FAILED_GAMES.size}] BGG ID: #{bgg_id} を処理中..."
    
    # 既存ゲームをチェック
    existing_game = Game.find_by(bgg_id: bgg_id)
    if existing_game
      puts "  ✓ 既に登録済み: #{existing_game.japanese_name.presence || existing_game.name}"
      skip_count += 1
      next
    end
    
    # BGGサービスを使用してゲーム情報を取得
    Rails.logger.info "Fetching game data for BGG ID: #{bgg_id}"
    game_data = BggService.get_game_details(bgg_id)
    
    if game_data && game_data[:name].present?
      puts "  📋 取得したゲーム名: #{game_data[:name]}"
      puts "  📋 日本語名: #{game_data[:japanese_name] || 'なし'}"
      
      # 基本的な属性のみでゲームを作成
      game = Game.new(
        bgg_id: bgg_id,
        name: game_data[:name],
        description: game_data[:description],
        min_players: game_data[:min_players],
        max_players: game_data[:max_players],
        play_time: game_data[:play_time],
        image_url: game_data[:image_url],
        bgg_score: game_data[:average_score],
        weight: game_data[:weight],
        designer: game_data[:designer],
        publisher: game_data[:publisher],
        registered_on_site: true
      )
      
      # 日本語情報がある場合のみ設定
      if game_data[:japanese_name].present?
        game.japanese_name = game_data[:japanese_name]
      end
      
      if game_data[:japanese_description].present?
        game.japanese_description = game_data[:japanese_description]
      end
      
      if game_data[:japanese_publisher].present?
        game.japanese_publisher = game_data[:japanese_publisher]
      end
      
      # メタデータを保存
      if game_data[:categories].present?
        game.store_metadata(:categories, game_data[:categories])
      end
      
      if game_data[:mechanics].present?
        game.store_metadata(:mechanics, game_data[:mechanics])
      end
      
      if game.save
        puts "  ✅ 登録成功: #{game.japanese_name.presence || game.name}"
        puts "     プレイ人数: #{game.min_players}-#{game.max_players}人"
        puts "     プレイ時間: #{game.play_time}分"
        puts "     デザイナー: #{game.designer}"
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
puts "🎯 BGG 失敗ゲーム再登録完了"
puts "=" * 60
puts "✅ 新規登録: #{success_count}件"
puts "⏭️  既存スキップ: #{skip_count}件"
puts "❌ エラー: #{error_count}件"
puts "📊 合計処理: #{success_count + skip_count + error_count}件"

if errors.any?
  puts "\n⚠️  エラー詳細:"
  errors.each { |error| puts "  - #{error}" }
end

puts "\n🎮 BGRシステムへの再登録が完了しました！"
puts "📈 新しく#{success_count}件のゲームが追加されました"

# 成功した場合は全体の登録状況を確認
if success_count > 0
  puts "\n📊 現在の登録ゲーム数:"
  total_games = Game.count
  puts "   合計: #{total_games}件"
  
  japanese_games = Game.where.not(japanese_name: [nil, '']).count
  puts "   日本語名付き: #{japanese_games}件"
end 