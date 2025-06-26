#!/usr/bin/env ruby

require_relative 'config/environment'

puts "🎯 BGGランキング制限機能テスト開始"
puts "=" * 60

# テスト用ゲーム（様々なランクのゲーム）
test_games = [
  { bgg_id: '174430', name: 'Gloomhaven', expected_rank: 'Very High (Top 10)' },
  { bgg_id: '316554', name: 'Dune: Imperium', expected_rank: 'High (Top 20)' },
  { bgg_id: '1', name: 'Die Macher', expected_rank: 'High (Top 50)' },
  { bgg_id: '15777', name: 'Space Munchkin', expected_rank: 'Medium (5000-15000)' },
  { bgg_id: '999999', name: 'Non-existent Game', expected_rank: 'Not Ranked' }
]

puts "📊 BGGランキング取得テスト"
puts "-" * 40

test_games.each do |game|
  begin
    puts "\n🎮 ゲーム: #{game[:name]} (BGG ID: #{game[:bgg_id]})"
    puts "  期待ランク: #{game[:expected_rank]}"
    
    # ランキング取得
    rank = BggService.get_game_rank(game[:bgg_id])
    puts "  実際のランク: #{rank == 999999 ? 'Not Ranked' : "#{rank}位"}"
    
    # 制限チェック
    meets_requirement = BggService.game_meets_rank_requirement?(game[:bgg_id], 10000)
    puts "  10,000位制限: #{meets_requirement ? '✅ 登録可能' : '❌ 登録不可'}"
    
    # 待機（BGG API制限対応）
    sleep(2)
    
  rescue => e
    puts "  ❌ エラー: #{e.message}"
  end
end

puts "\n" + "=" * 60
puts "🧪 実際の登録テスト"
puts "=" * 60

# 人気ゲーム（登録可能なはず）
puts "\n✅ 人気ゲーム登録テスト (Gloomhaven - 必ず10,000位以内)"
begin
  bgg_id = '174430'
  
  # 既存チェック
  existing_game = Game.find_by(bgg_id: bgg_id)
  if existing_game
    puts "  ⚠️  既に登録済み: #{existing_game.name}"
  else
    # ランキングチェック
    if BggService.game_meets_rank_requirement?(bgg_id, 10000)
      puts "  ✅ ランキング制限クリア - 登録を実行します..."
      
      # BGG情報取得
      bgg_game_info = BggService.get_game_details(bgg_id)
      if bgg_game_info
        puts "  📋 BGG情報取得成功: #{bgg_game_info[:name]}"
        puts "  🚀 実際の登録はスキップ（テストモード）"
      else
        puts "  ❌ BGG情報取得失敗"
      end
    else
      puts "  ❌ ランキング制限により登録不可"
    end
  end
rescue => e
  puts "  ❌ エラー: #{e.message}"
end

# 不人気ゲーム（登録不可のはず）
puts "\n❌ 不人気ゲーム登録テスト"
begin
  # 実在しないBGG IDで制限テスト
  fake_bgg_id = '999999'
  
  if BggService.game_meets_rank_requirement?(fake_bgg_id, 10000)
    puts "  ⚠️  予期しない結果: ランクなしゲームが登録可能と判定されました"
  else
    puts "  ✅ ランキング制限により正しく登録拒否されました"
  end
rescue => e
  puts "  ❌ エラー: #{e.message}"
end

puts "\n🎯 エラーメッセージテスト"
puts "-" * 40

# 様々なランクでのエラーメッセージテスト
[
  { rank: 15000, expected: 'ランキング表示' },
  { rank: 999999, expected: 'ランク付けなし表示' }
].each do |test_case|
  rank = test_case[:rank]
  error_message = if rank == 999999
    "申し訳ございませんが、BGGでランク付けされていないゲームは、サーバー容量の関係上登録できません。"
  else
    "申し訳ございませんが、BGGランキング#{rank}位のゲームは、サーバー容量の関係上登録できません。BGGランキング10,000位以内のゲームのみ登録可能です。"
  end
  
  puts "\n📝 #{test_case[:expected]}:"
  puts "  #{error_message}"
end

puts "\n" + "=" * 60
puts "✅ BGGランキング制限機能テスト完了"
puts "🎮 上記の結果を確認し、期待通りに動作していることを確認してください"
puts "=" * 60 