#!/usr/bin/env ruby

# テスト用スクリプト: 単純化アプローチでの新規ゲーム登録
# 実行方法: cd bgr4-api && ruby test_simplified_registration.rb

require_relative 'config/environment'

puts "🎯 単純化アプローチ - 新規ゲーム登録テスト開始"
puts "【重要】新ルール: システムレビュー廃止、BGG重み付け×10のみ"
puts "=" * 60

# テスト用BGGゲームリスト（人気ゲーム10件）
test_games = [
  { bgg_id: 174430, name: "Gloomhaven" },
  { bgg_id: 316554, name: "Dune: Imperium" },
  { bgg_id: 224517, name: "Brass: Birmingham" },
  { bgg_id: 167791, name: "Terraforming Mars" },
  { bgg_id: 266192, name: "Wingspan" },
  { bgg_id: 319191, name: "Cascadia" },
  { bgg_id: 120677, name: "Terra Mystica" },
  { bgg_id: 164928, name: "Orléans" },
  { bgg_id: 233078, name: "Twilight Imperium: Fourth Edition" },
  { bgg_id: 84876, name: "The Castles of Burgundy" }
]

success_count = 0
error_count = 0
results = []

test_games.each_with_index do |game_info, index|
  begin
    puts "\n#{index + 1}/10 テスト中: #{game_info[:name]} (BGG ID: #{game_info[:bgg_id]})"
    
    # 既存ゲームをチェック
    existing_game = Game.find_by(bgg_id: game_info[:bgg_id])
    
    if existing_game
      puts "  ⚠️  既存ゲーム発見: #{existing_game.name}"
      puts "  📊 システムレビュー数: #{existing_game.reviews.joins(:user).where(users: { email: 'system@boardgamereview.com' }).count}"
      puts "  🎲 site_recommended_players: #{existing_game.site_recommended_players}"
      puts "  ⭐ 平均スコア: #{existing_game.average_score_value}"
      
      results << {
        game: game_info[:name],
        status: "既存",
        system_reviews: existing_game.reviews.joins(:user).where(users: { email: 'system@boardgamereview.com' }).count,
        site_recommended: existing_game.site_recommended_players,
        average_score: existing_game.average_score_value
      }
      
      success_count += 1
      next
    end
    
    # BGGからゲーム情報を取得
    puts "  🔍 BGGからゲーム情報取得中..."
    bgg_game_info = BggService.get_game_details(game_info[:bgg_id])
    
    if bgg_game_info.nil?
      puts "  ❌ BGG情報取得失敗"
      error_count += 1
      next
    end
    
    puts "  ✅ BGG情報取得成功: #{bgg_game_info[:name]}"
    
    # ゲームを作成
    game = Game.new(
      bgg_id: game_info[:bgg_id],
      name: bgg_game_info[:name],
      japanese_name: bgg_game_info[:japanese_name],
      description: bgg_game_info[:description],
      image_url: bgg_game_info[:image_url],
      min_players: bgg_game_info[:min_players],
      max_players: bgg_game_info[:max_players],
      play_time: bgg_game_info[:play_time],
      weight: bgg_game_info[:weight],
      publisher: bgg_game_info[:publisher],
      designer: bgg_game_info[:designer],
      release_date: bgg_game_info[:release_date],
      registered_on_site: true
    )
    
    # メタデータを設定
    game.store_metadata(:best_num_players, bgg_game_info[:best_num_players]) if bgg_game_info[:best_num_players].present?
    game.store_metadata(:recommended_num_players, bgg_game_info[:recommended_num_players]) if bgg_game_info[:recommended_num_players].present?
    game.store_metadata(:categories, bgg_game_info[:categories]) if bgg_game_info[:categories].present?
    game.store_metadata(:mechanics, bgg_game_info[:mechanics]) if bgg_game_info[:mechanics].present?
    
    if game.save
      puts "  💾 ゲーム保存成功"
      
      # 【テスト重要】単純化アプローチ: create_initial_reviewsのみ呼び出し
      puts "  🔧 初期処理実行中（新ルール: BGG重み付けのみ）..."
      start_time = Time.current
      game.create_initial_reviews
      end_time = Time.current
      
      # 処理後の状態を確認
      game.reload
      system_reviews_count = game.reviews.joins(:user).where(users: { email: 'system@boardgamereview.com' }).count
      
      puts "  📊 処理結果:"
      puts "    - 処理時間: #{((end_time - start_time) * 1000).round(2)}ms"
      puts "    - システムレビュー数: #{system_reviews_count} (新ルールでは0であるべき)"
      puts "    - site_recommended_players: #{game.site_recommended_players}"
      puts "    - 平均スコア: #{game.average_score_value}"
      puts "    - 人気カテゴリー: #{game.popular_categories.first(3).map { |c| c[:name] }.join(', ')}"
      puts "    - 人気メカニクス: #{game.popular_mechanics.first(3).map { |m| m[:name] }.join(', ')}"
      
      # 新ルール適合性チェック
      rule_compliance = {
        no_system_reviews: system_reviews_count == 0,
        has_site_recommended: game.site_recommended_players.present?,
        has_average_score: game.average_score_value.present?
      }
      
      if rule_compliance.values.all?
        puts "  ✅ 新ルール適合性: 完全適合"
      else
        puts "  ⚠️  新ルール適合性: 一部不適合 #{rule_compliance}"
      end
      
      results << {
        game: game.name,
        status: "新規作成",
        system_reviews: system_reviews_count,
        site_recommended: game.site_recommended_players,
        average_score: game.average_score_value,
        processing_time_ms: ((end_time - start_time) * 1000).round(2),
        rule_compliance: rule_compliance
      }
      
      success_count += 1
    else
      puts "  ❌ ゲーム保存失敗: #{game.errors.full_messages.join(', ')}"
      error_count += 1
    end
    
  rescue => e
    puts "  💥 エラー発生: #{e.message}"
    puts "     #{e.backtrace.first(3).join("\n     ")}"
    error_count += 1
  end
  
  # 少し待機（API制限対策）
  sleep(1) if index < test_games.length - 1
end

puts "\n" + "=" * 60
puts "🎯 テスト結果サマリー"
puts "=" * 60
puts "✅ 成功: #{success_count}件"
puts "❌ 失敗: #{error_count}件"
puts "📊 成功率: #{(success_count.to_f / test_games.length * 100).round(1)}%"

puts "\n📋 詳細結果:"
results.each_with_index do |result, index|
  puts "#{index + 1}. #{result[:game]} (#{result[:status]})"
  puts "   システムレビュー: #{result[:system_reviews]}件"
  puts "   推奨プレイ人数: #{result[:site_recommended]}"
  puts "   平均スコア: #{result[:average_score]}"
  if result[:processing_time_ms]
    puts "   処理時間: #{result[:processing_time_ms]}ms"
  end
  if result[:rule_compliance]
    compliance_status = result[:rule_compliance].values.all? ? "✅ 適合" : "⚠️ 不適合"
    puts "   新ルール適合: #{compliance_status}"
  end
  puts ""
end

puts "🚀 単純化アプローチのテスト完了!"
puts "【確認項目】"
puts "- システムレビューが0件であること（新ルール）"
puts "- BGG重み付け計算が正常動作すること"
puts "- 重複処理が排除されていること"
puts "- プレイ人数推奨が適切に設定されること" 