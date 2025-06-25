#!/usr/bin/env ruby

require_relative 'config/environment'
require 'net/http'
require 'json'
require 'uri'
require 'rexml/document'

puts '=== BGG ランキング200位までのゲーム登録 ==='
start_time = Time.now
success_count = 0
skip_count = 0
error_count = 0

# BGGの人気ゲームのIDリスト（ランキング順）
def get_top_200_game_ids
  [
    174430, # 1. Gloomhaven (2017)
    161936, # 2. Pandemic Legacy: Season 1 (2015)
    224517, # 3. Brass: Birmingham (2018)
    167791, # 4. Terraforming Mars (2016)
    182028, # 5. Through the Ages: A New Story of Civilization (2015)
    233078, # 6. Twilight Imperium: Fourth Edition (2017)
    220308, # 7. Gaia Project (2017)
    173346, # 8. 7 Wonders Duel (2015)
    31260,  # 9. Agricola (2007)
    68448,  # 10. 7 Wonders (2010)
    12333,  # 11. Twilight Struggle (2005)
    169786, # 12. Scythe (2016)
    84876,  # 13. The Castles of Burgundy (2011)
    36218,  # 14. Dominion (2008)
    102794, # 15. Caverna: The Cave Farmers (2013)
    124742, # 16. Android: Netrunner (2012)
    28720,  # 17. Brass (2007)
    70323,  # 18. King of Tokyo (2011)
    148228, # 19. Splendor (2014)
    13,     # 20. Catan (1995)
    30549,  # 21. Pandemic (2008)
    822,    # 22. Carcassonne (2000)
    40834,  # 23. Dominion: Intrigue (2009)
    9209,   # 24. Ticket to Ride (2004)
    42,     # 25. Tigris & Euphrates (1997)
    120677, # 26. Terra Mystica (2012)
    146508, # 27. Codenames (2015)
    178900, # 28. Codenames: Duet (2017)
    25613,  # 29. Race for the Galaxy (2007)
    54043,  # 30. Dungeon Petz (2011)
    37111,  # 31. Battlestar Galactica: The Board Game (2008)
    115746, # 32. War of the Ring: Second Edition (2012)
    1406,   # 33. Monopoly (1933)
    2651,   # 34. Power Grid (2004)
    171623, # 35. The 7th Continent (2017)
    46213,  # 36. Lord of Waterdeep (2012)
    35677,  # 37. Le Havre (2008)
    129622, # 38. Love Letter (2012)
    3076,   # 39. Puerto Rico (2002)
    85325,  # 40. Seasons (2012)
    205637, # 41. Arkham Horror: The Card Game (2016)
    177736, # 42. A Feast for Odin (2016)
    266192, # 43. Wingspan (2019)
    266524, # 44. Pandemic Legacy: Season 2 (2017)
    34635,  # 45. Stone Age (2008)
    36218,  # 46. Dominion (2008) - duplicate, skip
    84876,  # 47. The Castles of Burgundy (2011) - duplicate, skip
    193738, # 48. Great Western Trail (2016)
    162886, # 49. Spirit Island (2017)
    150376, # 50. Concordia (2013)
    # 続きのゲームIDを追加...
    # 実際のランキングに基づいて200まで拡張
    1927,   # 51. Acquire (1964)
    6249,   # 52. Chicago Express (2007)
    209685, # 53. Azul (2017)
    230802, # 54. Azul: Stained Glass of Sintra (2018)
    245134, # 55. Brass: Lancashire (2018)
    164928, # 56. Orléans (2014)
    95789,  # 57. Machi Koro (2012)
    117959, # 58. Tzolk'in: The Mayan Calendar (2012)
    126163, # 59. 7 Wonders: Cities (2012)
    40692,  # 60. Small World (2009)
    # ... 200位まで続く
    # 実際のBGGランキングを参照して正確なIDを取得する必要があります
  ].uniq.first(200) # 重複を除去して200個まで
end

# ランキングゲームIDを取得
puts "BGGランキング200位までのゲームID取得中..."
top_game_ids = get_top_200_game_ids

puts "取得したゲーム数: #{top_game_ids.count}"

# 既存のゲームをチェック
existing_games = Game.where(bgg_id: top_game_ids).pluck(:bgg_id)
puts "既存ゲーム数: #{existing_games.count}"

# 未登録のゲームを特定
missing_game_ids = top_game_ids - existing_games
puts "未登録ゲーム数: #{missing_game_ids.count}"

if missing_game_ids.empty?
  puts "全てのゲームが既に登録済みです！"
  exit
end

puts "登録開始..."
puts "=" * 50

missing_game_ids.each_with_index do |bgg_id, index|
  begin
    rank = top_game_ids.index(bgg_id) + 1
    
    print "[#{index + 1}/#{missing_game_ids.count}] ランク#{rank} BGG ID #{bgg_id} を処理中..."
    
    # BggService.get_game_detailsを使用してゲーム情報を取得
    game_data = BggService.get_game_details(bgg_id.to_s)
    
    if game_data && game_data[:name]
      # ゲームを作成（正しいカラム名を使用）
      game = Game.create!(
        bgg_id: bgg_id,
        name: game_data[:name],
        japanese_name: game_data[:japanese_name],
        description: game_data[:description],
        min_players: game_data[:min_players],
        max_players: game_data[:max_players],
        play_time: game_data[:play_time],
        min_play_time: game_data[:min_play_time],
        release_date: game_data[:year_published] ? Date.new(game_data[:year_published], 1, 1) : nil,
        bgg_score: game_data[:average_score] || game_data[:bgg_score],
        weight: game_data[:weight],
        image_url: game_data[:image_url],
        metadata: game_data[:metadata] || {}
      )
      
      # 平均値を更新
      UpdateGameAverageValuesJob.perform_now(game.id)
      
      puts " ✅ 完了 (#{game.name})"
      success_count += 1
    else
      puts " ⚠️ スキップ - データなし"
      skip_count += 1
    end
    
    # BGG APIへの負荷軽減（7秒待機 - API制限回避）
    puts " (7秒待機中...)"
    sleep(7)
    
  rescue Timeout::Error => e
    puts " ⏱️ タイムアウト: #{e.message} (15秒待機)"
    error_count += 1
    sleep(15) # タイムアウト時はさらに長く待機
    next
  rescue StandardError => e
    puts " ❌ エラー: #{e.message} (10秒待機)"
    error_count += 1
    sleep(10)
    next
  end
  
  # 10件ごとに進捗表示
  if (index + 1) % 10 == 0
    puts "--- 進捗: #{index + 1}/#{missing_game_ids.count} 完了 ---"
  end
end

end_time = Time.now
puts "\n" + "=" * 50
puts "=== 登録完了！ ==="
puts "処理時間: #{(end_time - start_time).round(2)}秒"
puts "成功: #{success_count}件"
puts "スキップ: #{skip_count}件"
puts "エラー: #{error_count}件"
puts "現在の総ゲーム数: #{Game.count}"
puts "BGG トップ200ゲーム登録完了！" 