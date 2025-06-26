#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== 特定ゲームのメタデータ確認 ==="
puts ""

# ゲームID: 296151を確認
game_id = "296151"
game = Game.find_by(bgg_id: game_id)

if game
  puts "ゲーム名: #{game.name}"
  puts "BGG ID: #{game.bgg_id}"
  puts "登録日: #{game.created_at}"
  puts "メタデータ存在: #{game.metadata.present?}"
  puts ""
  
  if game.metadata.present?
    metadata = game.metadata
    puts "=== メタデータ内容 ==="
    puts "カテゴリ: #{metadata['categories']&.join(', ') || 'なし'}"
    puts "メカニクス: #{metadata['mechanics']&.join(', ') || 'なし'}"
    puts ""
    
    # BGG変換結果
    puts "=== BGG変換結果 ==="
    bgg_cats = game.get_bgg_converted_categories
    bgg_mechs = game.get_bgg_converted_mechanics
    
    puts "BGG変換カテゴリ: #{bgg_cats.join(', ')}"
    puts "BGG変換メカニクス: #{bgg_mechs.join(', ')}"
    puts ""
    
    # popular_categories/mechanicsの確認
    puts "=== 人気カテゴリ・メカニクス ==="
    pop_cats = game.popular_categories
    pop_mechs = game.popular_mechanics
    
    puts "人気カテゴリ: #{pop_cats.map { |c| c[:name] }.join(', ')}"
    puts "人気メカニクス: #{pop_mechs.map { |m| m[:name] }.join(', ')}"
    puts ""
    
    # レビュー数確認
    puts "=== レビュー情報 ==="
    reviews_count = game.reviews.count
    puts "レビュー数: #{reviews_count}"
    
  else
    puts "❌ メタデータが存在しません"
    puts ""
    
    # BGG APIから取得を試行
    puts "=== BGG APIからデータ取得テスト ==="
    begin
      game_data = BggService.get_game_details(game.bgg_id)
      
      if game_data
        puts "✅ BGG APIからデータ取得成功"
        puts "カテゴリ: #{game_data['categories']&.join(', ') || 'なし'}"
        puts "メカニクス: #{game_data['mechanics']&.join(', ') || 'なし'}"
        
        # メタデータを更新
        puts ""
        puts "メタデータを更新中..."
        game.update!(metadata: game_data)
        puts "✅ メタデータ更新完了"
        
      else
        puts "❌ BGG APIからデータ取得失敗"
      end
      
    rescue => e
      puts "❌ エラー: #{e.message}"
    end
  end
  
else
  puts "❌ ゲームが見つかりません (BGG ID: #{game_id})"
end 