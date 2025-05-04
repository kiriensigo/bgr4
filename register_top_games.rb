#!/usr/bin/env ruby
# encoding: utf-8

require 'net/http'
require 'json'
require 'base64'

# BGG TOP 100のゲームIDリスト
top_games_list = [
  "224517", # 1 - Brass: Birmingham
  "161936", # 2 - Pandemic Legacy: Season 1
  "342942", # 3 - Ark Nova
  "174430", # 4 - Gloomhaven
  "233078", # 5 - Twilight Imperium: Fourth Edition
  "316554", # 6 - Dune: Imperium
  "167791", # 7 - Terraforming Mars
  "115746", # 8 - War of the Ring: Second Edition
  "187645", # 9 - Star Wars: Rebellion
  "162886", # 10 - Spirit Island
  "291457", # 11 - Gloomhaven: Jaws of the Lion
  "220308", # 12 - Gaia Project
  "397598", # 13 - Dune: Imperium – Uprising
  "12333",  # 14 - Twilight Struggle
  "182028", # 15 - Through the Ages: A New Story of Civilization
  "84876",  # 16 - The Castles of Burgundy
  "193738", # 17 - Great Western Trail
  "169786", # 18 - Scythe
  "266192", # 19 - Wingspan
  "180263", # 20 - Viticulture Essential Edition
  "276025", # 21 - Sleeping Gods
  "167355", # 22 - Nemesis
  "170216", # 23 - Blood Rage
  "192921", # 24 - Everdell
  "183394", # 25 - Concordia Venus
  "221107", # 26 - Pandemic Legacy: Season 2
  "164153", # 27 - Star Wars: Imperial Assault
  "171623", # 28 - The Gallerist
  "295486", # 29 - Trajan
  "177736", # 30 - A Feast for Odin
  "199478", # 31 - Pax Pamir: Second Edition
  "233867", # 32 - Clank! In! Space!
  "124361", # 33 - Concordia
  "3076",   # 34 - Puerto Rico
  "169427", # 35 - Crokinole
  "251247", # 36 - Anachrony
  "288169", # 37 - Forgotten Waters
  "72125",  # 38 - Eclipse
  "205059", # 39 - Mansions of Madness: Second Edition
  "209010", # 40 - Mechs vs. Minions
  "312484", # 41 - Lost Ruins of Arnak
  "42",     # 42 - Tigris & Euphrates
  "120677", # 43 - Terra Mystica
  "173346", # 44 - 7 Wonders Duel
  "184267", # 45 - On Mars
  "175914", # 46 - Food Chain Magnate
  "285967", # 47 - Paladins of the West Kingdom
  "126163", # 48 - Pandemic: Iberia
  "31260",  # 49 - Agricola
  "172818", # 50 - Grand Austria Hotel
  "284083", # 51 - The Crew: Mission Deep Sea
  "290236", # 52 - Marvel Champions: The Card Game
  "102680", # 53 - Dungeon Petz
  "317985", # 54 - Beyond the Sun
  "300531", # 55 - Imperium: Classics
  "281549", # 56 - Dinosaur Island
  "28143",  # 57 - Race for the Galaxy
  "18602",  # 58 - Caylus
  "2955",   # 59 - Fury of Dracula
  "176920", # 60 - Roll for the Galaxy
  "42270",  # 61 - Robinson Crusoe: Adventures on the Cursed Island
  "40834",  # 62 - Agricola (Revised Edition 2016)
  "247763", # 63 - Underwater Cities
  "28720",  # 64 - Brass: Lancashire
  "256960", # 65 - Orleans
  "183840", # 66 - Gaia Project (duplicate, already at #12)
  "143519", # 67 - Tzolk'in: The Mayan Calendar
  "221965", # 68 - John Company: Second Edition
  "73439",  # 69 - Troyes
  "227935", # 70 - Architects of the West Kingdom
  "237182", # 71 - Root
  "320",    # 72 - Dune
  "25613",  # 73 - Through the Ages: A Story of Civilization
  "301929", # 74 - Paladins of the West Kingdom (duplicate, already at #47)
  "140934", # 75 - Twilight Imperium: Third Edition
  "295770", # 76 - Aeon's End: The New Age
  "255984", # 77 - Hallertau
  "246900", # 78 - Wingspan (duplicate, already at #19)
  "205637", # 79 - Orleans (duplicate, already at #65)
  "244992", # 80 - Barrage
  "284083", # 81 - The Crew: The Quest for Planet Nine (duplicate, already at #51)
  "55690",  # 82 - Kingdom Death: Monster
  "28143",  # 83 - Race for the Galaxy (duplicate, already at #57)
  "230802", # 84 - Azul
  "157354", # 85 - Five Tribes: The Djinns of Naqala
  "201808", # 86 - Clank!: A Deck-Building Adventure
  "72125",  # 87 - Eclipse: New Dawn for the Galaxy (duplicate, already at #38)
  "159675", # 88 - Fields of Arle
  "191189", # 89 - Aeon's End
  "371942", # 90 - The White Castle
  "332772", # 91 - Revive
  "110327", # 92 - Lords of Waterdeep
  "322289", # 93 - Darwin's Journey
  "93",     # 94 - El Grande
  "414317", # 95 - Harmonies
  "229853", # 96 - Teotihuacan: City of Gods
  "390092", # 97 - Ticket to Ride Legacy: Legends of the West
  "317985", # 98 - Beyond the Sun (duplicate, already at #54)
  "25613",  # 99 - Through the Ages: A Story of Civilization (duplicate, already at #73)
  "291453"  # 100 - SCOUT
]

# 重複を削除して一意のIDリストを作成
unique_game_ids = top_games_list.uniq

puts "BGG TOP 100から重複を除いた#{unique_game_ids.size}件のゲームを登録します。"

# APIのエンドポイント
api_url = "http://localhost:8080/api/v1/games"

# 管理者の認証トークン
admin_tokens = {
  "access-token" => "YOUR_ACCESS_TOKEN_HERE",
  "token-type" => "Bearer",
  "client" => "YOUR_CLIENT_ID_HERE",
  "expiry" => "YOUR_EXPIRY_HERE",
  "uid" => "admin@example.com"
}

# ゲーム登録の統計を初期化
stats = {
  success: 0,
  failed: 0,
  already_exists: 0
}

# 登録に失敗したゲームのIDを記録
failed_games = []

# 各ゲームを登録
unique_game_ids.each_with_index do |bgg_id, index|
  puts "#{index + 1}/#{unique_game_ids.size}. ゲームID #{bgg_id} を登録中..."
  
  # リクエスト準備
  uri = URI(api_url)
  http = Net::HTTP.new(uri.host, uri.port)
  request = Net::HTTP::Post.new(uri)
  
  # ヘッダー設定
  request["Content-Type"] = "application/json"
  request["Accept"] = "application/json"
  request["access-token"] = admin_tokens["access-token"]
  request["token-type"] = admin_tokens["token-type"]
  request["client"] = admin_tokens["client"]
  request["uid"] = admin_tokens["uid"]
  
  # リクエストボディ設定
  request.body = {
    game: {
      bgg_id: bgg_id
    },
    auto_register: true
  }.to_json
  
  # リクエスト送信
  begin
    response = http.request(request)
    
    case response.code
    when "200", "201"
      # 成功
      game_data = JSON.parse(response.body)
      puts "✅ 登録成功: #{game_data["name"]}"
      stats[:success] += 1
    when "409"
      # 既に存在するゲーム
      puts "⚠️ 既に登録済み: #{bgg_id}"
      stats[:already_exists] += 1
    else
      # その他のエラー
      puts "❌ 登録失敗: #{bgg_id} - ステータスコード: #{response.code}"
      puts "エラー詳細: #{response.body}"
      stats[:failed] += 1
      failed_games << bgg_id
    end
  rescue => e
    puts "❌ 例外発生: #{e.message}"
    stats[:failed] += 1
    failed_games << bgg_id
  end
  
  # APIへの負荷を減らすため少し待機
  sleep(1) unless index == unique_game_ids.size - 1
end

# 結果を表示
puts "\n======= 登録結果 ======="
puts "成功: #{stats[:success]}"
puts "既に登録済み: #{stats[:already_exists]}"
puts "失敗: #{stats[:failed]}"

if failed_games.any?
  puts "\n失敗したゲームID:"
  failed_games.each { |id| puts "- #{id}" }
end 