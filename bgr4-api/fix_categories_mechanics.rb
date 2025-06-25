#!/usr/bin/env ruby

require_relative 'config/environment'

puts "BGG ID 172818のカテゴリー・メカニクスを修正中..."

game = Game.find_by(bgg_id: '172818')

if !game
  puts "ゲームが見つかりません"
  exit
end

puts "\n=== 修正前の状態 ==="
puts "メタデータ Categories: #{game.metadata['categories']}"
puts "メタデータ Mechanics: #{game.metadata['mechanics']}"

# システムユーザーを取得
system_user = User.find_by(email: 'system@boardgamereview.com')
if !system_user
  puts "システムユーザーが見つかりません"
  exit
end

# 既存のシステムレビューを確認
existing_reviews = game.reviews.where(user: system_user)
puts "既存システムレビュー数: #{existing_reviews.count}"

if existing_reviews.any?
  puts "\n=== システムレビューを更新中... ==="
  
  categories = game.metadata['categories'] || []
  mechanics = game.metadata['mechanics'] || []
  
  updated_count = 0
  existing_reviews.each do |review|
    if review.categories.blank? || review.mechanics.blank?
      review.update!(
        categories: categories,
        mechanics: mechanics,
        custom_tags: ['BGG推奨', 'システム生成']
      )
      updated_count += 1
    end
  end
  
  puts "更新されたレビュー数: #{updated_count}"
  
  # 最新の状態を確認
  puts "\n=== 修正後の確認 ==="
  sample_review = existing_reviews.reload.first
  puts "サンプルレビューのカテゴリー: #{sample_review.categories}"
  puts "サンプルレビューのメカニクス: #{sample_review.mechanics}"
  puts "サンプルレビューのカスタムタグ: #{sample_review.custom_tags}"
  
  # popular_categories と popular_mechanics を再確認
  puts "\n=== popular_categories結果 ==="
  popular_cats = game.popular_categories
  puts "Popular categories: #{popular_cats}"
  
  puts "\n=== popular_mechanics結果 ==="
  popular_mechs = game.popular_mechanics
  puts "Popular mechanics: #{popular_mechs}"
  
else
  puts "システムレビューが見つかりません。新規作成が必要です。"
end

puts "\n修正完了！" 