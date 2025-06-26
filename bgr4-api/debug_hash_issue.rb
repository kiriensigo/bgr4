#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== Hash問題の調査 ==="
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
  puts "game_dataの内容:"
  puts game_data.inspect[0..200] + "..."
  
  # 異なる変換方法を試す
  puts "\n=== 変換テスト ==="
  
  # 方法1: to_h
  begin
    hash1 = game_data.to_h
    puts "to_h成功: #{hash1.class}"
  rescue => e
    puts "to_h失敗: #{e.message}"
  end
  
  # 方法2: deep_transform_keys
  begin
    hash2 = game_data.deep_transform_keys(&:to_s)
    puts "deep_transform_keys成功: #{hash2.class}"
  rescue => e
    puts "deep_transform_keys失敗: #{e.message}"
  end
  
  # 方法3: JSON経由
  begin
    json_str = JSON.generate(game_data)
    hash3 = JSON.parse(json_str)
    puts "JSON経由成功: #{hash3.class}"
  rescue => e
    puts "JSON経由失敗: #{e.message}"
  end
  
else
  puts "対象ゲームが見つかりません"
end 