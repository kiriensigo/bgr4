require_relative 'config/environment'

puts "🎯 単純化アプローチ - 既存ゲーム状態チェック"
puts "=" * 50

# BGG ID 172818 (Above and Below) を確認
game = Game.find_by(bgg_id: '172818')

if game
  puts "ゲーム名: #{game.name}"
  puts "日本語名: #{game.japanese_name}"
  
  # システムレビュー数をチェック
  system_user = User.find_by(email: 'system@boardgamereview.com')
  system_reviews_count = system_user ? game.reviews.where(user_id: system_user.id).count : 0
  
  puts "システムレビュー数: #{system_reviews_count}"
  puts "site_recommended_players: #{game.site_recommended_players}"
  puts "平均スコア: #{game.average_score_value}"
  
  # 新ルール適合性チェック
  rule_compliance = {
    no_system_reviews: system_reviews_count == 0,
    has_site_recommended: game.site_recommended_players.present?,
    has_average_score: game.average_score_value.present?
  }
  
  puts "新ルール適合性: #{rule_compliance.values.all? ? '✅ 適合' : '⚠️ 不適合'}"
  puts "詳細: #{rule_compliance}"
else
  puts "BGG ID 172818のゲームが見つかりません"
end

puts "\n総ゲーム数: #{Game.count}"
puts "登録済みゲーム数: #{Game.where(registered_on_site: true).count}" 