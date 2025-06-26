#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== Metadataカラムの詳細確認 ==="
puts ""

# スキーマ情報を確認
connection = ActiveRecord::Base.connection
columns = connection.columns('games')

metadata_column = columns.find { |col| col.name == 'metadata' }

if metadata_column
  puts "Metadataカラムの詳細:"
  puts "  名前: #{metadata_column.name}"
  puts "  SQL型: #{metadata_column.sql_type}"
  puts "  Ruby型: #{metadata_column.type}"
  puts "  NULL許可: #{metadata_column.null}"
  puts "  デフォルト値: #{metadata_column.default.inspect}"
else
  puts "Metadataカラムが見つかりません"
end

puts ""

# 実際のゲームでテスト
game = Game.where('metadata IS NOT NULL').first

if game
  puts "既存ゲームのmetadata確認:"
  puts "  ゲーム名: #{game.name}"
  puts "  metadataクラス: #{game.metadata.class}"
  puts "  metadata存在: #{game.metadata.present?}"
  puts "  metadata内容: #{game.metadata.inspect[0..200]}..."
else
  puts "metadataがあるゲームが見つかりません"
end

puts ""
puts "=== 直接更新テスト ==="

# 直接Hashで更新してみる
test_game = Game.where('created_at > ?', 2.days.ago)
               .where(registered_on_site: true)
               .where('metadata IS NULL')
               .first

if test_game
  puts "テスト対象: #{test_game.name}"
  
  test_metadata = {
    categories: ["Test Category"],
    mechanics: ["Test Mechanic"],
    test: true
  }
  
  begin
    test_game.update!(metadata: test_metadata)
    test_game.reload
    
    puts "Hash更新成功:"
    puts "  metadataクラス: #{test_game.metadata.class}"
    puts "  categories: #{test_game.metadata['categories']}"
    puts "  mechanics: #{test_game.metadata['mechanics']}"
    
  rescue => e
    puts "Hash更新失敗: #{e.message}"
  end
  
else
  puts "テスト対象ゲームが見つかりません"
end 