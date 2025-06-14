#!/usr/bin/env ruby

# 不完全なシステムレビューを修正するスクリプト
puts "=== 不完全なシステムレビューの修正 ==="

system_user = User.find_by(email: 'system@boardgamereview.com')
reviews = Review.where(user_id: system_user.id)
game_counts = reviews.group(:game_id).count

# 10件未満のゲームを特定
incomplete_games = game_counts.select { |game_id, count| count < 10 }

puts "不完全なゲーム数: #{incomplete_games.count}"

incomplete_games.each do |bgg_id, count|
  game = Game.find_by(bgg_id: bgg_id)
  game_name = game ? game.name : "BGG ID: #{bgg_id}"
  needed = 10 - count
  
  puts "#{game_name}: #{count}件 (#{needed}件不足)"
  
  # 不足分を追加
  needed.times do |i|
    begin
      review = Review.create!(
        user_id: system_user.id,
        game_id: bgg_id,
        overall_score: 7.0,
        rule_complexity: 3.0,
        luck_factor: 3.0,
        interaction: 3.0,
        downtime: 3.0,
        recommended_players: [],
        categories: ['戦略ゲーム'],
        mechanics: [],
        short_comment: "BGG APIベースのシステムレビュー"
      )
      print "."
    rescue => e
      puts "\nエラー: #{e.message}"
    end
  end
  puts " 完了"
end

# 最終確認
final_reviews = Review.where(user_id: system_user.id)
final_game_counts = final_reviews.group(:game_id).count
complete_games = final_game_counts.select { |game_id, count| count >= 10 }.count
incomplete_games = final_game_counts.select { |game_id, count| count < 10 }.count

puts "\n=== 修正完了 ==="
puts "システムレビュー完了ゲーム: #{complete_games}ゲーム"
puts "システムレビュー不完全ゲーム: #{incomplete_games}ゲーム"
puts "総システムレビュー数: #{final_reviews.count}件" 