# Dune: Imperiumのおすすめプレイ人数計算テスト
game = Game.find_by(bgg_id: "316554")

if game.nil?
  puts "Dune: Imperium (BGG ID: 316554) が見つかりません"
  exit
end

puts "=== Dune: Imperium おすすめプレイ人数計算テスト ==="
puts "ゲーム名: #{game.name}"
puts "日本語名: #{game.japanese_name}"

# BGG情報を確認
puts "\n=== BGG推奨プレイ人数情報 ==="
puts "Best Players: #{game.best_num_players || 'なし'}"
puts "Recommended Players: #{game.recommended_num_players || 'なし'}"

# 現在のレビュー情報を確認
all_reviews = game.reviews
total_reviews_count = all_reviews.count
reviews_with_players = all_reviews.where.not(recommended_players: nil)

puts "\n=== レビュー情報 ==="
puts "総レビュー数: #{total_reviews_count}"
puts "プレイ人数設定済みレビュー数: #{reviews_with_players.count}"

# 現在のユーザー投票を確認
if reviews_with_players.count > 0
  all_recommended_players = reviews_with_players.pluck(:recommended_players).flatten
  normalized_players = all_recommended_players.map do |player|
    player_num = player.to_i
    player_num >= 7 ? "7" : player
  end
  user_player_counts = normalized_players.group_by(&:itself).transform_values(&:count)
  
  puts "\n=== ユーザー投票状況 ==="
  user_player_counts.each do |player, count|
    puts "#{player}人: #{count}票"
  end
end

# 新しい計算方式を手動で実行
puts "\n=== 新しい推奨度計算 ==="

# BGGの推奨プレイ人数情報を取得（BestとRecommendedを統合）
bgg_recommended_players = []
if game.best_num_players.present?
  bgg_recommended_players.concat(game.best_num_players)
end
if game.recommended_num_players.present?
  bgg_recommended_players.concat(game.recommended_num_players)
end

# BGGの推奨人数も7以上を「7」に変換して重複削除
bgg_normalized_players = bgg_recommended_players.map do |player|
  player_num = player.to_i
  player_num >= 7 ? "7" : player.to_s
end.uniq

puts "BGG統合推奨プレイ人数: #{bgg_normalized_players.join(', ')}"

# ユーザー投票数を集計
user_player_counts = {}
if reviews_with_players.count > 0
  all_recommended_players = reviews_with_players.pluck(:recommended_players).flatten
  normalized_players = all_recommended_players.map do |player|
    player_num = player.to_i
    player_num >= 7 ? "7" : player
  end
  user_player_counts = normalized_players.group_by(&:itself).transform_values(&:count)
end

# 各プレイ人数の推奨度を計算
player_scores = {}
(1..7).each do |num|
  player_key = num == 7 ? "7" : num.to_s
  
  # ユーザー投票数
  user_votes = user_player_counts[player_key] || 0
  
  # BGG推奨フラグ（BestまたはRecommendedに含まれている場合は1、そうでなければ0）
  bgg_flag = bgg_normalized_players.include?(player_key) ? 1 : 0
  
  # 推奨度を計算
  score = (user_votes + bgg_flag * 10) / (total_reviews_count + 10).to_f
  
  player_scores[player_key] = score
  
  puts "#{player_key}人: ユーザー投票#{user_votes}票 + BGG推奨#{bgg_flag} × 10 = #{user_votes + bgg_flag * 10} / #{total_reviews_count + 10} = #{score.round(3)} (#{(score * 100).round(1)}%)"
end

# 50%以上の推奨度を持つ人数を抽出
recommended_players = player_scores
  .select { |_, score| score >= 0.5 }
  .keys
  .sort_by { |player| player.to_i }

puts "\n=== 結果 ==="
puts "推奨プレイ人数: #{recommended_players.join(', ')}"
puts "現在のsite_recommended_players: #{game.site_recommended_players || 'なし'}" 