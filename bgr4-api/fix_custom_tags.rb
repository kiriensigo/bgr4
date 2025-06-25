#!/usr/bin/env ruby

require_relative 'config/environment'

puts "BGG ID 172818のカスタムタグを修正中..."

game = Game.find_by(bgg_id: '172818')

if !game
  puts "ゲームが見つかりません"
  exit
end

# システムユーザーを取得
system_user = User.find_by(email: 'system@boardgamereview.com')
existing_reviews = game.reviews.where(user: system_user)

if existing_reviews.any?
  puts "\n=== カスタムタグのみを修正中... ==="
  
  # カスタムタグは「BGG推奨」「システム生成」のみにする
  custom_tags_only = ['BGG推奨', 'システム生成']
  
  updated_count = 0
  existing_reviews.each do |review|
    review.update!(custom_tags: custom_tags_only)
    updated_count += 1
  end
  
  puts "更新されたレビュー数: #{updated_count}"
  
  # 修正後の確認
  puts "\n=== 修正後の確認 ==="
  sample_review = existing_reviews.reload.first
  puts "サンプルレビューのカテゴリー: #{sample_review.categories}"
  puts "サンプルレビューのメカニクス: #{sample_review.mechanics}"
  puts "サンプルレビューのカスタムタグ: #{sample_review.custom_tags}"
  
  # popular_categories を再確認
  puts "\n=== popular_categories結果（修正後） ==="
  popular_cats = game.popular_categories
  puts "Popular categories: #{popular_cats}"
  
  puts "\n修正完了！"
else
  puts "システムレビューが見つかりません"
end 