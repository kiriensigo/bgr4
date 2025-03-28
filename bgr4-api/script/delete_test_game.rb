#!/usr/bin/env ruby
# encoding: utf-8

# テストゲームを削除するスクリプト
puts "テストゲームを検索中..."
test_game = Game.find_by(bgg_id: 'jp-44OG44K544OI44Ky44O844Og')

if test_game
  puts "テストゲーム「#{test_game.name}」(ID: #{test_game.id}, BGG ID: #{test_game.bgg_id})を削除します"
  test_game.destroy
  puts "削除完了"
else
  puts "テストゲームは見つかりませんでした"
end

# 削除後の確認
test_game_check = Game.find_by(bgg_id: 'jp-44OG44K544OI44Ky44O844Og')
puts "確認結果: テストゲーム #{test_game_check ? '存在します' : '削除されました'}"

# 総ゲーム数を表示
puts "現在のゲーム数: #{Game.count}" 