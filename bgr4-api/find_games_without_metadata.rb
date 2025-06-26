#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== メタデータ不足ゲームの検索 ==="
puts ""

# メタデータがないゲームを検索（最新のものから）
games_without_metadata = Game.where('created_at > ?', 7.days.ago)
                             .where(registered_on_site: true)
                             .where('metadata IS NULL')
                             .order(created_at: :desc)
                             .limit(20)

puts "📊 過去7日間に登録されたメタデータ不足ゲーム: #{games_without_metadata.count}件"
puts ""

if games_without_metadata.any?
  puts "=== 修正対象ゲーム ==="
  games_without_metadata.each_with_index do |game, i|
    puts "#{i+1}. #{game.name} (BGG ID: #{game.bgg_id}) - 登録日: #{game.created_at.strftime('%Y-%m-%d %H:%M')}"
  end
  
  puts ""
  puts "これらのゲームのメタデータを修正しますか？ [y/N]"
  
  # 自動で修正を実行
  puts "自動修正を開始します..."
  puts ""
  
  fixed_count = 0
  
  games_without_metadata.each_with_index do |game, i|
    begin
      puts "#{i+1}/#{games_without_metadata.count}: #{game.name} (BGG ID: #{game.bgg_id})"
      
      # BGG APIからデータ取得
      game_data = BggService.get_game_details(game.bgg_id)
      
      if game_data
        # メタデータ更新
        game.update!(metadata: game_data)
        
        # 確認
        game.reload
        bgg_cats = game.get_bgg_converted_categories
        bgg_mechs = game.get_bgg_converted_mechanics
        
        puts "  ✅ 更新完了"
        puts "    カテゴリ: #{bgg_cats.join(', ')}"
        puts "    メカニクス: #{bgg_mechs.join(', ')}"
        
        fixed_count += 1
        
        # API制限を避けるため少し待機
        sleep(3)
        
      else
        puts "  ❌ BGG APIからデータ取得失敗"
      end
      
    rescue => e
      puts "  ❌ エラー: #{e.message}"
    end
    
    puts ""
  end
  
  puts "=== 修正完了 ==="
  puts "修正されたゲーム数: #{fixed_count}/#{games_without_metadata.count}"
  
else
  puts "✅ メタデータ不足のゲームはありません"
end 