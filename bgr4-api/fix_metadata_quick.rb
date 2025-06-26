#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== メタデータ修正（最新ゲーム） ==="
puts ""

# メタデータがない最新ゲームを対象
games_to_fix = Game.where('created_at > ?', 2.days.ago)
                   .where(registered_on_site: true)
                   .where('metadata IS NULL')
                   .limit(10)

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
      # メタデータ更新
      game.update!(metadata: game_data.to_json)
      
      # 確認
      metadata = JSON.parse(game.metadata)
      puts "  ✅ 更新完了:"
      puts "    カテゴリ: #{metadata['categories']&.join(', ') || 'なし'}"
      puts "    メカニクス: #{metadata['mechanics']&.join(', ') || 'なし'}"
      
      fixed_count += 1
    else
      puts "  ❌ BGG APIからデータ取得失敗"
    end
    
    # API制限対策
    sleep(3)
    
  rescue => e
    puts "  ❌ エラー: #{e.message}"
  end
  
  puts ""
end

puts "🎉 修正完了: #{fixed_count}件" 