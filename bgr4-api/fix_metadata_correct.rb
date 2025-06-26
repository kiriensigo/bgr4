#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== メタデータ修正（正しい版） ==="
puts ""

# メタデータがない最新ゲームを対象
games_to_fix = Game.where('created_at > ?', 2.days.ago)
                   .where(registered_on_site: true)
                   .where('metadata IS NULL')
                   .limit(5)

puts "📊 修正対象: #{games_to_fix.count}件"
puts ""

fixed_count = 0

games_to_fix.each_with_index do |game, i|
  begin
    puts "#{i+1}/#{games_to_fix.count}: #{game.name} (BGG ID: #{game.bgg_id})"
    
    # BGG APIからデータ取得
    puts "  🔍 BGG APIからデータ取得中..."
    game_data = BggService.get_game_details(game.bgg_id)
    
    if game_data
      # HashをJSONに変換
      metadata_json = JSON.generate(game_data)
      
      # メタデータ更新
      game.update!(metadata: metadata_json)
      
      # 確認
      metadata = JSON.parse(game.metadata)
      puts "  ✅ 更新完了:"
      puts "    カテゴリ: #{metadata['categories']&.join(', ') || 'なし'}"
      puts "    メカニクス: #{metadata['mechanics']&.join(', ') || 'なし'}"
      
      # BGG変換結果も確認
      bgg_cats = game.get_bgg_converted_categories
      bgg_mechs = game.get_bgg_converted_mechanics
      puts "    BGG変換カテゴリ: #{bgg_cats.join(', ')}"
      puts "    BGG変換メカニクス: #{bgg_mechs.join(', ')}"
      
      fixed_count += 1
    else
      puts "  ❌ BGG APIからデータ取得失敗"
    end
    
    # API制限対策
    sleep(3)
    
  rescue => e
    puts "  ❌ エラー: #{e.message}"
    puts "  スタックトレース: #{e.backtrace.first(3).join(', ')}"
  end
  
  puts ""
end

puts "🎉 修正完了: #{fixed_count}件" 