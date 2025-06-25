#!/usr/bin/env ruby

require_relative 'config/environment'

puts '=== 全システムレビュー削除 ==='

# システムユーザーの確認
system_user = User.find_by(email: 'system@boardgamereview.com')

if system_user
  puts "システムユーザー ID: #{system_user.id}"
  
  # システムレビューの確認
  system_reviews = Review.where(user_id: system_user.id)
  puts "削除対象のシステムレビュー数: #{system_reviews.count}件"
  
  if system_reviews.count > 0
    puts "\n削除を開始します..."
    
    # バッチで削除（効率的）
    deleted_count = Review.where(user_id: system_user.id).delete_all
    puts "✅ #{deleted_count}件のシステムレビューを削除しました"
    
    # 確認
    remaining_reviews = Review.where(user_id: system_user.id).count
    puts "残りのシステムレビュー: #{remaining_reviews}件"
    
    if remaining_reviews == 0
      puts "\n🎉 すべてのシステムレビューが正常に削除されました！"
    else
      puts "\n⚠️ 一部のシステムレビューが残っています"
    end
    
    # 全ゲームの平均値を再計算
    puts "\n平均値の再計算を開始..."
    Game.find_each do |game|
      UpdateGameAverageValuesJob.perform_now(game.id)
      print "."
    end
    puts "\n✅ 平均値の再計算完了"
    
  else
    puts "\n✅ 削除対象のシステムレビューはありません"
  end
else
  puts "システムユーザーが見つかりません"
end

# 最終確認
puts "\n=== 最終確認 ==="
total_reviews = Review.count
puts "現在の全レビュー数: #{total_reviews}件"

if system_user
  final_system_reviews = Review.where(user_id: system_user.id).count
  puts "システムレビュー数: #{final_system_reviews}件"
end 