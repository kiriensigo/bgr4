# リファクタリングされたBGGサービスのテスト

# 手動でサービスをロード
require_relative 'app/services/bgg'
require_relative 'app/services/bgg/base_service'
require_relative 'app/services/bgg/game_parser'
require_relative 'app/services/bgg/game_service'
require_relative 'app/services/bgg/popular_games_service'
require_relative 'app/services/bgg/japanese_version_service'
require_relative 'app/services/bgg_service_refactored'

puts "=== リファクタリングされたBGGサービステスト ==="

# 1つのゲームでテスト（Aeon's End）
bgg_id = "191189"

puts "\n1. 新しいBgg::GameServiceのテスト"
begin
  game_details = Bgg::GameService.get_game_details(bgg_id)
  
  if game_details
    puts "✅ ゲーム取得成功: #{game_details[:name]}"
    puts "  BGG ID: #{game_details[:bgg_id]}"
    puts "  日本語名: #{game_details[:japanese_name] || 'なし'}"
    puts "  プレイ人数: #{game_details[:min_players]}-#{game_details[:max_players]}人"
    puts "  BGG Best: #{game_details[:best_num_players]}"
    puts "  BGG Recommended: #{game_details[:recommended_num_players]}"
  else
    puts "❌ ゲーム取得失敗"
  end
rescue => e
  puts "❌ エラー: #{e.message}"
  puts "  #{e.backtrace.first}"
end

puts "\n2. ファサードクラス（BggServiceRefactored）のテスト"
begin
  game_details = BggServiceRefactored.get_game_details(bgg_id)
  
  if game_details
    puts "✅ ファサード経由でのゲーム取得成功: #{game_details[:name]}"
  else
    puts "❌ ファサード経由でのゲーム取得失敗"
  end
rescue => e
  puts "❌ エラー: #{e.message}"
  puts "  #{e.backtrace.first}"
end

puts "\n3. 構造の整理状況"
puts "新しいサービス構造:"
puts "  - Bgg::BaseService (基底クラス)"
puts "  - Bgg::GameService (ゲーム取得)"
puts "  - Bgg::GameParser (データ解析)"
puts "  - Bgg::PopularGamesService (人気ゲーム)"
puts "  - Bgg::JapaneseVersionService (日本語版)"
puts "  - BggServiceRefactored (互換性ファサード)"

puts "\n=== テスト完了 ===" 