#!/usr/bin/env ruby
# 手動登録: Unlock! Epic Adventures (BGG ID: 294612)

require_relative 'config/environment'

puts "🎯 手動登録: Unlock! Epic Adventures"
puts "BGG ID: 294612"
puts "=" * 50

begin
  bgg_id = '294612'
  
  # 既存ゲームチェック
  existing_game = Game.find_by(bgg_id: bgg_id)
  if existing_game
    puts "⚠️  既存のゲームが見つかりました: #{existing_game.name}"
    puts "登録済みフラグ: #{existing_game.registered_on_site}"
    
    if !existing_game.registered_on_site
      puts "🔧 registered_on_siteをtrueに更新中..."
      existing_game.update!(registered_on_site: true)
      puts "✅ 更新完了"
    end
    
    exit
  end
  
  # BGG情報取得
  puts "📡 BGGから情報取得中..."
  bgg_game_info = BggService.get_game_details(bgg_id)
  
  if bgg_game_info.nil?
    puts "❌ BGG情報取得失敗"
    
    # 手動でゲーム情報を設定
    puts "🔧 手動でゲーム情報を設定..."
    game = Game.create!(
      bgg_id: bgg_id,
      name: "Unlock! Epic Adventures",
      min_players: 1,
      max_players: 6,
      play_time: 60,
      weight: 2.0,
      publisher: "Space Cowboys",
      designer: "Cyril Demaegd, Fabrice Mazza",
      registered_on_site: true,
      image_url: "https://cf.geekdo-images.com/i_e2Zb3FIFb7e0kE_W_BHrTk7Bg=/fit-in/246x300/filters:strip_icc()/pic4872969.jpg"
    )
    
    # メタデータを手動設定
    game.store_metadata(:categories, ["Adventure", "Card Game", "Puzzle", "Real-time"])
    game.store_metadata(:mechanics, ["Cooperative Game", "Storytelling", "Variable Player Powers"])
    game.store_metadata(:recommended_num_players, ["2", "3", "4"])
    game.save!
    
    puts "✅ 手動でゲーム作成完了"
  else
    puts "✅ BGG情報取得成功: #{bgg_game_info[:name]}"
    
    # 通常の登録処理
    game = Game.create!(
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
    
    # メタデータ設定
    game.store_metadata(:categories, bgg_game_info[:categories]) if bgg_game_info[:categories].present?
    game.store_metadata(:mechanics, bgg_game_info[:mechanics]) if bgg_game_info[:mechanics].present?
    game.store_metadata(:recommended_num_players, bgg_game_info[:recommended_num_players]) if bgg_game_info[:recommended_num_players].present?
    game.save!
    
    puts "✅ BGG情報でゲーム作成完了"
  end
  
  # 単純化アプローチで初期処理
  puts "🚀 単純化アプローチ初期処理実行中..."
  game.create_initial_reviews
  
  puts "📊 最終結果:"
  game.reload
  puts "  ID: #{game.id}"
  puts "  BGG ID: #{game.bgg_id}"
  puts "  名前: #{game.name}"
  puts "  登録済み: #{game.registered_on_site}"
  puts "  平均スコア: #{game.average_score_value}"
  puts "  推奨プレイ人数: #{game.site_recommended_players}"
  
  # システムレビューチェック
  system_user = User.find_by(email: 'system@boardgamereview.com')
  system_reviews_count = system_user ? game.reviews.where(user_id: system_user.id).count : 0
  puts "  システムレビュー数: #{system_reviews_count} (新ルールでは0であるべき)"
  
  puts "\n🎊 Unlock! Epic Adventures の登録が完了しました！"
  puts "フロントエンドURL: /games/294612"
  
rescue => e
  puts "❌ エラー発生: #{e.message}"
  puts "詳細:"
  puts e.backtrace.first(5).join("\n")
end 