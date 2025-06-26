#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== Update問題の詳細調査 ==="
puts ""

# 1つのゲームでテスト
game = Game.where('created_at > ?', 2.days.ago)
           .where(registered_on_site: true)
           .where('metadata IS NULL')
           .first

if game
  puts "テスト対象: #{game.name} (BGG ID: #{game.bgg_id})"
  
  # BGG APIからデータ取得
  game_data = BggService.get_game_details(game.bgg_id)
  
  puts "game_dataのクラス: #{game_data.class}"
  
  # JSON変換
  metadata_json = JSON.generate(game_data)
  puts "JSON変換成功: #{metadata_json.class}, 長さ: #{metadata_json.length}"
  
  # 更新前の状態を確認
  puts "更新前のmetadata: #{game.metadata.inspect}"
  
  # 更新実行
  begin
    puts "更新実行中..."
    result = game.update!(metadata: metadata_json)
    puts "更新成功: #{result}"
    
    # 更新後の確認
    game.reload
    puts "更新後のmetadata存在: #{game.metadata.present?}"
    puts "更新後のmetadataクラス: #{game.metadata.class}"
    
    # JSON解析テスト
    if game.metadata.present?
      parsed = JSON.parse(game.metadata)
      puts "JSON解析成功: カテゴリ数 #{parsed['categories']&.length || 0}"
      puts "カテゴリ: #{parsed['categories']&.join(', ') || 'なし'}"
    end
    
  rescue => e
    puts "更新エラー: #{e.message}"
    puts "エラークラス: #{e.class}"
    puts "スタックトレース:"
    puts e.backtrace.first(5).join("\n")
  end
  
else
  puts "対象ゲームが見つかりません"
end 