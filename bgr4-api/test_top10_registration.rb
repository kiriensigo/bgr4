#!/usr/bin/env ruby

require_relative 'config/environment'

puts "🎯 BGGランキング上位10位ゲーム登録テスト"
puts "=" * 60

# BGGランキング上位10位のゲームID（2024年12月時点）
# https://boardgamegeek.com/browse/boardgame から取得
TOP_10_GAMES = [
  { rank: 1, bgg_id: 224517, name: 'Brass: Birmingham' },
  { rank: 2, bgg_id: 161936, name: 'Pandemic Legacy: Season 1' },
  { rank: 3, bgg_id: 342942, name: 'Ark Nova' },
  { rank: 4, bgg_id: 174430, name: 'Gloomhaven' },
  { rank: 5, bgg_id: 233078, name: 'Twilight Imperium: Fourth Edition' },
  { rank: 6, bgg_id: 316554, name: 'Dune: Imperium' },
  { rank: 7, bgg_id: 167791, name: 'Terraforming Mars' },
  { rank: 8, bgg_id: 115746, name: 'War of the Ring: Second Edition' },
  { rank: 9, bgg_id: 187645, name: 'Star Wars: Rebellion' },
  { rank: 10, bgg_id: 162886, name: 'Spirit Island' }
]

puts "📈 登録対象: #{TOP_10_GAMES.size}件のゲーム"
puts "⏱️  推定時間: 約#{TOP_10_GAMES.size * 10}秒（API制限考慮）"
puts "-" * 60

start_time = Time.current
success_count = 0
skip_count = 0
error_count = 0
results = []

# システムユーザーを取得または作成
system_user = User.find_or_create_by(email: 'system@boardgamereview.com') do |user|
  user.name = 'BoardGameGeek'
  user.password = SecureRandom.hex(16)
  user.password_confirmation = user.password
  user.provider = 'system'
  user.uid = 'system'
end

puts "👤 システムユーザー: #{system_user.name} (ID: #{system_user.id})"

TOP_10_GAMES.each_with_index do |game_info, index|
  begin
    puts "\n[#{index + 1}/#{TOP_10_GAMES.size}] #{game_info[:rank]}位: #{game_info[:name]} (BGG ID: #{game_info[:bgg_id]})"
    
    # 既存ゲームをチェック
    existing_game = Game.find_by(bgg_id: game_info[:bgg_id])
    if existing_game
      puts "  ✅ 既に登録済み"
      if !existing_game.registered_on_site?
        existing_game.update!(registered_on_site: true)
        puts "     🔧 registered_on_site フラグを更新"
      end
      skip_count += 1
      results << { rank: game_info[:rank], name: game_info[:name], status: 'skipped', reason: '既存' }
      next
    end
    
    # BGGランキング制限チェック
    puts "  🔍 ランキング制限チェック中..."
    unless BggService.game_meets_rank_requirement?(game_info[:bgg_id], 10000)
      puts "  ❌ ランキング制限により登録不可"
      error_count += 1
      results << { rank: game_info[:rank], name: game_info[:name], status: 'blocked', reason: 'ランキング制限' }
      next
    end
    puts "  ✅ ランキング制限クリア"
    
    # BGGからゲーム情報を取得
    puts "  📡 BGG API からゲーム情報取得中..."
    bgg_game_info = BggService.get_game_details(game_info[:bgg_id])
    
    if bgg_game_info.nil?
      puts "  ❌ BGG情報取得失敗"
      error_count += 1
      results << { rank: game_info[:rank], name: game_info[:name], status: 'error', reason: 'BGG API失敗' }
      next
    end
    
    puts "  📋 取得成功: #{bgg_game_info[:name]}"
    puts "     日本語名: #{bgg_game_info[:japanese_name] || 'なし'}"
    puts "     プレイ人数: #{bgg_game_info[:min_players]}-#{bgg_game_info[:max_players]}人"
    puts "     プレイ時間: #{bgg_game_info[:play_time]}分"
    puts "     BGGスコア: #{bgg_game_info[:average_score]}"
    puts "     重量: #{bgg_game_info[:weight]}"
    
    # ゲームを作成
    puts "  🎮 ゲーム作成中..."
    game = Game.new(
      bgg_id: game_info[:bgg_id],
      name: bgg_game_info[:name],
      japanese_name: bgg_game_info[:japanese_name],
      description: bgg_game_info[:description],
      image_url: bgg_game_info[:image_url],
      japanese_image_url: bgg_game_info[:japanese_image_url],
      min_players: bgg_game_info[:min_players],
      max_players: bgg_game_info[:max_players],
      play_time: bgg_game_info[:play_time],
      min_play_time: bgg_game_info[:min_play_time],
      weight: bgg_game_info[:weight],
      publisher: bgg_game_info[:publisher],
      designer: bgg_game_info[:designer],
      release_date: bgg_game_info[:release_date],
      japanese_publisher: bgg_game_info[:japanese_publisher],
      japanese_release_date: bgg_game_info[:japanese_release_date],
      registered_on_site: true
    )
    
    # メタデータを設定
    game.store_metadata(:expansions, bgg_game_info[:expansions]) if bgg_game_info[:expansions].present?
    game.store_metadata(:best_num_players, bgg_game_info[:best_num_players]) if bgg_game_info[:best_num_players].present?
    game.store_metadata(:recommended_num_players, bgg_game_info[:recommended_num_players]) if bgg_game_info[:recommended_num_players].present?
    game.store_metadata(:categories, bgg_game_info[:categories]) if bgg_game_info[:categories].present?
    game.store_metadata(:mechanics, bgg_game_info[:mechanics]) if bgg_game_info[:mechanics].present?
    
    if game.save
      puts "  ✅ ゲーム登録成功"
      
      # 初期レビュー作成
      puts "  📝 初期レビュー作成中..."
      game.create_initial_reviews
      puts "  ✅ 初期レビュー作成完了"
      
      success_count += 1
      results << { 
        rank: game_info[:rank], 
        name: game_info[:name], 
        status: 'success', 
        japanese_name: game.japanese_name,
        bgg_id: game.bgg_id
      }
    else
      puts "  ❌ ゲーム保存失敗: #{game.errors.full_messages.join(', ')}"
      error_count += 1
      results << { rank: game_info[:rank], name: game_info[:name], status: 'error', reason: 'DB保存失敗' }
    end
    
    # API制限を考慮して待機
    puts "  ⏱️  10秒待機中..."
    sleep(10)
    
  rescue => e
    puts "  ❌ エラー: #{e.message}"
    Rails.logger.error "Top 10 registration error for #{game_info[:name]}: #{e.message}\n#{e.backtrace.join("\n")}"
    error_count += 1
    results << { rank: game_info[:rank], name: game_info[:name], status: 'error', reason: e.message }
    
    sleep(5) # エラー時も少し待機
  end
end

end_time = Time.current
total_time = end_time - start_time

puts "\n" + "=" * 60
puts "🎯 BGGランキング上位10位ゲーム登録完了"
puts "=" * 60
puts "✅ 新規登録: #{success_count}件"
puts "⏭️  既存スキップ: #{skip_count}件"
puts "❌ エラー/ブロック: #{error_count}件"
puts "⏱️  実行時間: #{(total_time / 60).round(2)}分"
puts "📊 合計処理: #{success_count + skip_count + error_count}件"

puts "\n📋 詳細結果:"
results.each do |result|
  status_icon = case result[:status]
                when 'success' then '✅'
                when 'skipped' then '⏭️'
                when 'blocked' then '🚫'
                when 'error' then '❌'
                end
  
  puts "  #{status_icon} #{result[:rank]}位: #{result[:name]}"
  puts "     日本語名: #{result[:japanese_name] || 'なし'}" if result[:japanese_name]
  puts "     BGG ID: #{result[:bgg_id]}" if result[:bgg_id]
  puts "     理由: #{result[:reason]}" if result[:reason]
end

# 現在の登録ゲーム総数を確認
total_games = Game.where(registered_on_site: true).count
puts "\n🎮 現在の登録ゲーム総数: #{total_games}件"

puts "\n🚀 BGGランキング上位ゲーム登録テスト完了！" 