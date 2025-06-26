#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== メタデータ欠損ゲームの修正 ==="
puts ""

# メタデータがnullまたは空の新規登録ゲームを対象
missing_metadata_games = Game.where('created_at > ?', 2.days.ago)
                              .where(registered_on_site: true)
                              .where('metadata IS NULL OR metadata = ?', '')

puts "📊 対象ゲーム数: #{missing_metadata_games.count}件"
puts ""

fixed_count = 0
error_count = 0

missing_metadata_games.each_with_index do |game, i|
  begin
    puts "#{i+1}/#{missing_metadata_games.count}: #{game.name} (BGG ID: #{game.bgg_id})"
    
    # BGG APIから詳細情報を再取得
    puts "  🔍 BGG APIからメタデータ取得中..."
    game_data = BggService.get_game_details(game.bgg_id)
    
    unless game_data
      puts "  ❌ BGG APIからデータ取得失敗"
      error_count += 1
      next
    end
    
    # メタデータを更新
    puts "  📋 メタデータ更新中..."
    game.update!(metadata: game_data.to_json)
    
    # 更新されたメタデータを確認
    metadata = JSON.parse(game.metadata)
    puts "  ✅ メタデータ更新完了:"
    puts "    categories: #{metadata['categories']&.join(', ') || 'なし'}"
    puts "    mechanics: #{metadata['mechanics']&.join(', ') || 'なし'}"
    puts "    best_num_players: #{metadata['best_num_players']&.join(', ') || 'なし'}"
    
    # popular_categoriesとpopular_mechanicsの再計算も実行
    puts "  🔄 カテゴリ・メカニクス再計算中..."
    
    # BGG変換結果を確認
    bgg_cats = game.get_bgg_converted_categories
    bgg_mechs = game.get_bgg_converted_mechanics
    
    puts "  🏷️  BGG変換結果:"
    puts "    変換後カテゴリ: #{bgg_cats.join(', ')}"
    puts "    変換後メカニクス: #{bgg_mechs.join(', ')}"
    
    fixed_count += 1
    
    # API制限を避けるため少し待機
    sleep(2)
    
  rescue => e
    error_count += 1
    puts "  ❌ エラー: #{e.message}"
  end
  
  puts ""
end

puts "=" * 60
puts "🎉 メタデータ修正完了！"
puts "✅ 修正成功: #{fixed_count}件"
puts "❌ エラー: #{error_count}件"
puts "=" * 60 