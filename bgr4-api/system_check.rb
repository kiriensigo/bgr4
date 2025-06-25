#!/usr/bin/env ruby

puts "🔍 BGR4システム状態チェック"
puts "=" * 50

begin
  require_relative 'config/environment'
  puts "✅ Rails環境の読み込み: 成功"
  
  # データベース接続チェック
  ActiveRecord::Base.connection.execute("SELECT 1")
  puts "✅ データベース接続: 成功"
  
  # 基本統計
  puts "\n📊 基本統計:"
  puts "総ゲーム数: #{Game.count}"
  puts "登録済みゲーム数: #{Game.where(registered_on_site: true).count}"
  puts "総レビュー数: #{Review.count}"
  
  # システムユーザーチェック
  system_user = User.find_by(email: 'system@boardgamereview.com')
  if system_user
    puts "✅ システムユーザー: 存在"
    system_reviews_total = Review.where(user_id: system_user.id).count
    puts "システムレビュー総数: #{system_reviews_total}"
  else
    puts "⚠️  システムユーザー: 不存在"
  end
  
  # BGG ID 172818のチェック
  puts "\n🎯 テストゲーム (BGG ID: 172818) チェック:"
  test_game = Game.find_by(bgg_id: '172818')
  
  if test_game
    puts "ゲーム名: #{test_game.name}"
    puts "日本語名: #{test_game.japanese_name}"
    
    system_reviews_count = system_user ? test_game.reviews.where(user_id: system_user.id).count : 0
    puts "システムレビュー数: #{system_reviews_count}"
    puts "site_recommended_players: #{test_game.site_recommended_players}"
    puts "平均スコア: #{test_game.average_score_value}"
    
    # 新ルール適合性
    rule_compliance = {
      no_system_reviews: system_reviews_count == 0,
      has_site_recommended: test_game.site_recommended_players.present?,
      has_average_score: test_game.average_score_value.present?
    }
    
    compliance_status = rule_compliance.values.all? ? "✅ 完全適合" : "⚠️ 不適合"
    puts "新ルール適合性: #{compliance_status}"
    
    if !rule_compliance.values.all?
      puts "詳細: #{rule_compliance}"
    end
  else
    puts "❌ BGG ID 172818のゲームが見つかりません"
  end
  
  # 最近のゲーム5件をチェック
  puts "\n📋 最近登録されたゲーム5件:"
  recent_games = Game.where(registered_on_site: true).order(created_at: :desc).limit(5)
  
  recent_games.each_with_index do |game, index|
    system_reviews_count = system_user ? game.reviews.where(user_id: system_user.id).count : 0
    compliance = system_reviews_count == 0 ? "✅" : "⚠️ #{system_reviews_count}件"
    puts "#{index + 1}. #{game.name} (#{game.bgg_id}) - システムレビュー: #{compliance}"
  end
  
  puts "\n🚀 チェック完了!"
  
rescue => e
  puts "❌ エラー発生: #{e.message}"
  puts "詳細: #{e.backtrace.first(5).join("\n")}"
end 