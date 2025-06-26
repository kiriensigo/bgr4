#!/usr/bin/env ruby

require_relative 'config/environment'

puts "🔍 BGGランキング上位の未登録ゲーム検索"
puts "=" * 60

# BGGランキング上位50位のゲームID（一部）
# 実際の現在のランキングを含む
CANDIDATE_GAMES = [
  # 既知の上位ゲーム
  { rank: 1, bgg_id: 224517, name: 'Brass: Birmingham' },
  { rank: 2, bgg_id: 161936, name: 'Pandemic Legacy: Season 1' },
  { rank: 3, bgg_id: 342942, name: 'Ark Nova' },
  { rank: 4, bgg_id: 174430, name: 'Gloomhaven' },
  { rank: 5, bgg_id: 233078, name: 'Twilight Imperium: Fourth Edition' },
  { rank: 6, bgg_id: 316554, name: 'Dune: Imperium' },
  { rank: 7, bgg_id: 167791, name: 'Terraforming Mars' },
  { rank: 8, bgg_id: 115746, name: 'War of the Ring: Second Edition' },
  { rank: 9, bgg_id: 187645, name: 'Star Wars: Rebellion' },
  { rank: 10, bgg_id: 162886, name: 'Spirit Island' },
  
  # 10-20位あたりの候補
  { rank: 11, bgg_id: 169786, name: 'Scythe' },
  { rank: 12, bgg_id: 266192, name: 'Wings of Glory: WW1' },
  { rank: 13, bgg_id: 220308, name: 'Gaia Project' },
  { rank: 14, bgg_id: 193738, name: 'Great Western Trail' },
  { rank: 15, bgg_id: 266810, name: 'Wingspan' },
  { rank: 16, bgg_id: 147020, name: 'Star Wars: Imperial Assault' },
  { rank: 17, bgg_id: 84876, name: 'The Castles of Burgundy' },
  { rank: 18, bgg_id: 146021, name: 'Eldritch Horror' },
  { rank: 19, bgg_id: 31260, name: 'Agricola' },
  { rank: 20, bgg_id: 12333, name: 'Twilight Struggle' },
  
  # 21-30位あたりの候補
  { rank: 21, bgg_id: 205637, name: 'Arkham Horror: The Card Game' },
  { rank: 22, bgg_id: 129622, name: 'Love Letter' },
  { rank: 23, bgg_id: 244521, name: 'Concordia' },
  { rank: 24, bgg_id: 148228, name: 'Splendor' },
  { rank: 25, bgg_id: 124742, name: 'Android: Netrunner' },
  { rank: 26, bgg_id: 122515, name: 'Lords of Waterdeep' },
  { rank: 27, bgg_id: 182028, name: 'Through the Ages: A New Story of Civilization' },
  { rank: 28, bgg_id: 104162, name: 'Castle Panic' },
  { rank: 29, bgg_id: 103343, name: 'King of Tokyo' },
  { rank: 30, bgg_id: 70323, name: 'King of New York' },
  
  # さらに追加候補（実際にランクインしている可能性のあるゲーム）
  { rank: 31, bgg_id: 150312, name: 'Mansions of Madness: Second Edition' },
  { rank: 32, bgg_id: 36218, name: 'Dominion' },
  { rank: 33, bgg_id: 13, name: 'Catan' },
  { rank: 34, bgg_id: 68448, name: '7 Wonders' },
  { rank: 35, bgg_id: 14996, name: 'Ticket to Ride' },
  { rank: 36, bgg_id: 133473, name: 'Innovation' },
  { rank: 37, bgg_id: 30549, name: 'Pandemic' },
  { rank: 38, bgg_id: 40834, name: 'Dominion: Intrigue' },
  { rank: 39, bgg_id: 175914, name: 'Food Chain Magnate' },
  { rank: 40, bgg_id: 28720, name: 'Brass' },
  
  # 最近人気のゲーム
  { rank: 41, bgg_id: 367498, name: 'Frosthaven' },
  { rank: 42, bgg_id: 295947, name: 'Everdell' },
  { rank: 43, bgg_id: 284083, name: 'The Crew: The Quest for Planet Nine' },
  { rank: 44, bgg_id: 350933, name: 'Lost Ruins of Arnak' },
  { rank: 45, bgg_id: 266507, name: 'Underwater Cities' },
  { rank: 46, bgg_id: 322330, name: 'Spirit Island: Branch & Claw' },
  { rank: 47, bgg_id: 123540, name: 'Tzolkin: The Mayan Calendar' },
  { rank: 48, bgg_id: 28143, name: 'Race for the Galaxy' },
  { rank: 49, bgg_id: 102794, name: 'Seasons' },
  { rank: 50, bgg_id: 346703, name: 'Radlands' }
]

puts "📋 検索対象: #{CANDIDATE_GAMES.size}件のゲーム"
puts "🔍 未登録ゲームを検索中..."
puts "-" * 60

unregistered_games = []
registered_count = 0

CANDIDATE_GAMES.each do |game_info|
  existing_game = Game.find_by(bgg_id: game_info[:bgg_id])
  
  if existing_game
    registered_count += 1
    puts "  ✅ #{game_info[:rank]}位: #{game_info[:name]} (既存)"
  else
    unregistered_games << game_info
    puts "  🎯 #{game_info[:rank]}位: #{game_info[:name]} (未登録)"
  end
end

puts "\n" + "=" * 60
puts "🔍 検索結果"
puts "=" * 60
puts "✅ 既存登録: #{registered_count}件"
puts "🎯 未登録発見: #{unregistered_games.size}件"

if unregistered_games.size > 0
  puts "\n📋 未登録ゲーム一覧:"
  unregistered_games.first(10).each do |game|
    puts "  🎮 #{game[:rank]}位: #{game[:name]} (BGG ID: #{game[:bgg_id]})"
  end
  
  if unregistered_games.size > 10
    puts "  ... 他#{unregistered_games.size - 10}件"
  end
  
  puts "\n🚀 この中から#{[unregistered_games.size, 10].min}件を登録しますか？"
  puts "   実行するには: ruby register_top_unregistered_games.rb"
else
  puts "\n😮 上位50位以内のゲームは全て登録済みです！"
  puts "   より深いランクのゲームを探すか、BGGの最新ランキングを確認してください。"
end

puts "\n🎮 現在の登録ゲーム総数: #{Game.where(registered_on_site: true).count}件" 