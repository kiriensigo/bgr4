#!/usr/bin/env ruby

# スクリプトの目的: Ark Novaのシステムレビューを更新する

puts "Ark Novaのシステムレビュー更新を開始します"

# ゲームを検索
game = Game.find_by(bgg_id: "342942")
if game
  puts "ゲーム情報: #{game.name} (BGG ID: #{game.bgg_id})"
  
  # システムユーザーを取得
  system_user = User.find_by(email: 'system@boardgamereview.com')
  if system_user
    puts "システムユーザーを見つけました: #{system_user.email}"
    
    # 既存のシステムレビューを削除
    reviews_count = game.reviews.where(user: system_user).count
    puts "削除対象のレビュー数: #{reviews_count}"
    game.reviews.where(user: system_user).destroy_all
    
    # システムレビューを更新
    result = game.update_system_reviews
    puts "更新結果: #{result}"
    
    # 更新後のレビュー数を確認
    new_reviews_count = game.reviews.where(user: system_user).count
    puts "更新後のレビュー数: #{new_reviews_count}"
  else
    puts "システムユーザーが見つかりません"
  end
else
  puts "ゲーム「Ark Nova (342942)」が見つかりません"
end

puts "処理が完了しました"
