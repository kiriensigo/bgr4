#!/usr/bin/env ruby

require_relative 'config/environment'

puts "🚀 BGGランキング上位未登録ゲーム登録"
puts "=" * 60

# 発見された未登録の上位ゲーム
UNREGISTERED_TOP_GAMES = [
  { rank: 16, bgg_id: 147020, name: 'Star Wars: Imperial Assault' },
  { rank: 26, bgg_id: 122515, name: 'Lords of Waterdeep' },
  { rank: 28, bgg_id: 104162, name: 'Castle Panic' },
  { rank: 29, bgg_id: 103343, name: 'King of Tokyo' },
  { rank: 35, bgg_id: 14996, name: 'Ticket to Ride' },
  { rank: 36, bgg_id: 133473, name: 'Innovation' },
  { rank: 41, bgg_id: 367498, name: 'Frosthaven' },
  { rank: 46, bgg_id: 322330, name: 'Spirit Island: Branch & Claw' },
  { rank: 47, bgg_id: 123540, name: 'Tzolkin: The Mayan Calendar' },
  { rank: 50, bgg_id: 346703, name: 'Radlands' }
]

puts "🎯 登録対象: #{UNREGISTERED_TOP_GAMES.size}件の上位ゲーム"
puts "⏱️  推定時間: 約#{UNREGISTERED_TOP_GAMES.size * 15}秒（API制限考慮）"
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

UNREGISTERED_TOP_GAMES.each_with_index do |game_info, index|
  begin
    puts "\n[#{index + 1}/#{UNREGISTERED_TOP_GAMES.size}] BGGランク#{game_info[:rank]}位: #{game_info[:name]} (BGG ID: #{game_info[:bgg_id]})"
    
    # 既存ゲームを再チェック（念のため）
    existing_game = Game.find_by(bgg_id: game_info[:bgg_id])
    if existing_game
      puts "  ✅ 既に登録済みでした"
      if !existing_game.registered_on_site?
        existing_game.update!(registered_on_site: true)
        puts "     🔧 registered_on_site フラグを更新"
      end
      skip_count += 1
      results << { rank: game_info[:rank], name: game_info[:name], status: 'skipped', reason: '既存' }
      next
    end
    
    # BGGランキング制限チェック（念のため）
    puts "  🔍 ランキング制限チェック中..."
    rank = BggService.get_game_rank(game_info[:bgg_id])
    rank_display = rank == 999999 ? 'Not Ranked' : "#{rank}位"
    puts "     実際のBGGランク: #{rank_display}"
    
    unless BggService.game_meets_rank_requirement?(game_info[:bgg_id], 10000)
      puts "  ❌ ランキング制限により登録不可"
      error_count += 1
      results << { rank: game_info[:rank], name: game_info[:name], status: 'blocked', reason: "BGGランク#{rank}位のため制限" }
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
    puts "     デザイナー: #{bgg_game_info[:designer]}"
    puts "     パブリッシャー: #{bgg_game_info[:publisher]}"
    
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
      registered_on_site: true,
      bgg_score: bgg_game_info[:average_score]
    )
    
    # メタデータを設定
    game.store_metadata(:expansions, bgg_game_info[:expansions]) if bgg_game_info[:expansions].present?
    game.store_metadata(:best_num_players, bgg_game_info[:best_num_players]) if bgg_game_info[:best_num_players].present?
    game.store_metadata(:recommended_num_players, bgg_game_info[:recommended_num_players]) if bgg_game_info[:recommended_num_players].present?
    game.store_metadata(:categories, bgg_game_info[:categories]) if bgg_game_info[:categories].present?
    game.store_metadata(:mechanics, bgg_game_info[:mechanics]) if bgg_game_info[:mechanics].present?
    
    if game.save
      puts "  ✅ ゲーム登録成功 (ID: #{game.id})"
      
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
        bgg_id: game.bgg_id,
        game_id: game.id,
        bgg_score: game.bgg_score
      }
    else
      puts "  ❌ ゲーム保存失敗: #{game.errors.full_messages.join(', ')}"
      error_count += 1
      results << { rank: game_info[:rank], name: game_info[:name], status: 'error', reason: 'DB保存失敗' }
    end
    
    # API制限を考慮して待機
    puts "  ⏱️  15秒待機中（API制限考慮）..."
    sleep(15)
    
  rescue => e
    puts "  ❌ エラー: #{e.message}"
    Rails.logger.error "Top games registration error for #{game_info[:name]}: #{e.message}\n#{e.backtrace.join("\n")}"
    error_count += 1
    results << { rank: game_info[:rank], name: game_info[:name], status: 'error', reason: e.message }
    
    sleep(5)
  end
end

end_time = Time.current
total_time = end_time - start_time

puts "\n" + "=" * 60
puts "🚀 BGGランキング上位ゲーム登録完了"
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
  
  puts "  #{status_icon} BGGランク#{result[:rank]}位: #{result[:name]}"
  if result[:status] == 'success'
    puts "     日本語名: #{result[:japanese_name] || 'なし'}"
    puts "     BGG ID: #{result[:bgg_id]} | Game ID: #{result[:game_id]}"
    puts "     BGGスコア: #{result[:bgg_score]}"
  elsif result[:reason]
    puts "     理由: #{result[:reason]}"
  end
end

# 最終的な登録ゲーム総数を確認
total_games = Game.where(registered_on_site: true).count
puts "\n🎮 新しい登録ゲーム総数: #{total_games}件 (#{success_count}件増加)"

puts "\n🎉 BGGランキング上位ゲーム登録完了！"
puts "   これで人気の高いゲームが#{success_count}件追加されました。" 