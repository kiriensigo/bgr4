#!/usr/bin/env ruby

# 単体テスト: Unlock! Epic Adventures (BGG ID: 294612)
# 単純化アプローチでの新規ゲーム登録テスト

require_relative 'config/environment'

puts "🎯 単体登録テスト: Unlock! Epic Adventures"
puts "BGG ID: 294612"
puts "URL: https://boardgamegeek.com/boardgame/294612/unlock-epic-adventures"
puts "=" * 60

bgg_id = '294612'
game_name = "Unlock! Epic Adventures"

begin
  puts "🔍 STEP 1: 既存ゲームチェック"
  existing_game = Game.find_by(bgg_id: bgg_id)
  
  if existing_game
    puts "  ⚠️  既存ゲーム発見: #{existing_game.name}"
    puts "  📅 登録日: #{existing_game.created_at}"
    puts "  🎲 registered_on_site: #{existing_game.registered_on_site}"
    
    # システムレビュー数をチェック
    system_user = User.find_by(email: 'system@boardgamereview.com')
    system_reviews_count = system_user ? existing_game.reviews.where(user_id: system_user.id).count : 0
    
    puts "  📊 現在の状態:"
    puts "    - システムレビュー数: #{system_reviews_count}"
    puts "    - site_recommended_players: #{existing_game.site_recommended_players}"
    puts "    - 平均スコア: #{existing_game.average_score_value}"
    puts "    - ユーザーレビュー数: #{existing_game.user_review_count}"
    
    # 新ルール適合性チェック
    rule_compliance = {
      no_system_reviews: system_reviews_count == 0,
      has_site_recommended: existing_game.site_recommended_players.present?,
      has_average_score: existing_game.average_score_value.present?
    }
    
    compliance_status = rule_compliance.values.all? ? "✅ 完全適合" : "⚠️ 不適合"
    puts "  🔍 新ルール適合性: #{compliance_status}"
    
    if !rule_compliance.values.all?
      puts "    詳細: #{rule_compliance}"
    end
    
    puts "\n✅ 既存ゲームの状態確認完了"
    exit
  end
  
  puts "  🆕 新規ゲーム: 登録処理を開始します"
  
  puts "\n🔍 STEP 2: BGG情報取得"
  puts "  📡 BGGから詳細情報を取得中..."
  
  start_time = Time.current
  bgg_game_info = BggService.get_game_details(bgg_id)
  fetch_time = Time.current - start_time
  
  if bgg_game_info.nil?
    puts "  ❌ BGG情報取得失敗"
    puts "  💡 BGGサーバーの応答が無いか、ゲームIDが無効です"
    exit 1
  end
  
  puts "  ✅ BGG情報取得成功 (#{(fetch_time * 1000).round(2)}ms)"
  puts "  📋 取得情報:"
  puts "    - 名前: #{bgg_game_info[:name]}"
  puts "    - 日本語名: #{bgg_game_info[:japanese_name] || 'なし'}"
  puts "    - プレイ人数: #{bgg_game_info[:min_players]}-#{bgg_game_info[:max_players]}人"
  puts "    - プレイ時間: #{bgg_game_info[:play_time]}分"
  puts "    - 複雑度: #{bgg_game_info[:weight] || 'なし'}"
  puts "    - 発行元: #{bgg_game_info[:publisher] || 'なし'}"
  puts "    - デザイナー: #{bgg_game_info[:designer] || 'なし'}"
  puts "    - BGG推奨人数: #{bgg_game_info[:recommended_num_players] || 'なし'}"
  puts "    - カテゴリー: #{bgg_game_info[:categories]&.join(', ') || 'なし'}"
  puts "    - メカニクス: #{bgg_game_info[:mechanics]&.join(', ') || 'なし'}"
  
  puts "\n🔧 STEP 3: ゲーム作成"
  game = Game.new(
    bgg_id: bgg_id,
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
  
  puts "  📝 ゲームオブジェクト作成完了"
  puts "  💾 データベース保存中..."
  
  save_start_time = Time.current
  if game.save
    save_time = Time.current - save_start_time
    puts "  ✅ ゲーム保存成功 (#{(save_time * 1000).round(2)}ms)"
    
    puts "\n🚀 STEP 4: 単純化アプローチ初期処理"
    puts "  【重要】新ルール適用: システムレビュー廃止、BGG重み付け×10のみ"
    puts "  🔧 create_initial_reviews実行中..."
    
    initial_start_time = Time.current
    game.create_initial_reviews  # ← 単純化アプローチ: 単一呼び出し
    initial_time = Time.current - initial_start_time
    
    puts "  ✅ 初期処理完了 (#{(initial_time * 1000).round(2)}ms)"
    
    puts "\n📊 STEP 5: 結果検証"
    game.reload
    
    # システムレビュー数チェック
    system_user = User.find_by(email: 'system@boardgamereview.com')
    system_reviews_count = system_user ? game.reviews.where(user_id: system_user.id).count : 0
    
    puts "  📈 処理結果:"
    puts "    - 総処理時間: #{((fetch_time + save_time + initial_time) * 1000).round(2)}ms"
    puts "    - BGG情報取得: #{(fetch_time * 1000).round(2)}ms"
    puts "    - データベース保存: #{(save_time * 1000).round(2)}ms"
    puts "    - 初期処理: #{(initial_time * 1000).round(2)}ms"
    puts ""
    puts "  🎯 新ルール適合性チェック:"
    puts "    - システムレビュー数: #{system_reviews_count} (0であるべき)"
    puts "    - site_recommended_players: #{game.site_recommended_players}"
    puts "    - 平均スコア: #{game.average_score_value}"
    puts "    - 人気カテゴリー: #{game.popular_categories.first(3).map { |c| "#{c[:name]}(#{c[:count]})" }.join(', ')}"
    puts "    - 人気メカニクス: #{game.popular_mechanics.first(3).map { |m| "#{m[:name]}(#{m[:count]})" }.join(', ')}"
    
    # 新ルール適合性の最終判定
    rule_compliance = {
      no_system_reviews: system_reviews_count == 0,
      has_site_recommended: game.site_recommended_players.present?,
      has_average_score: game.average_score_value.present?,
      has_categories: game.popular_categories.any?,
      has_mechanics: game.popular_mechanics.any?
    }
    
    passed_checks = rule_compliance.values.count(true)
    total_checks = rule_compliance.length
    
    puts "\n🏆 最終結果:"
    if rule_compliance.values.all?
      puts "  ✅ 新ルール完全適合! (#{passed_checks}/#{total_checks})"
      puts "  🎊 単純化アプローチによる登録成功!"
    else
      puts "  ⚠️  一部不適合 (#{passed_checks}/#{total_checks})"
      puts "  📋 詳細:"
      rule_compliance.each do |check, result|
        status = result ? "✅" : "❌"
        puts "    #{status} #{check}: #{result}"
      end
    end
    
    puts "\n📄 登録完了情報:"
    puts "  ゲームID: #{game.id}"
    puts "  BGG ID: #{game.bgg_id}"
    puts "  ゲーム名: #{game.name}"
    puts "  日本語名: #{game.japanese_name || '未設定'}"
    puts "  フロントエンドURL: /games/#{game.bgg_id}"
    
  else
    puts "  ❌ ゲーム保存失敗"
    puts "  エラー詳細: #{game.errors.full_messages.join(', ')}"
    exit 1
  end
  
rescue => e
  puts "\n💥 エラー発生:"
  puts "  エラーメッセージ: #{e.message}"
  puts "  詳細:"
  puts "    #{e.backtrace.first(5).join("\n    ")}"
  exit 1
end

puts "\n🚀 Unlock! Epic Adventures 登録テスト完了!"
puts "単純化アプローチの動作検証が完了しました。" 