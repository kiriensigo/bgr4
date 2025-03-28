#!/usr/bin/env ruby
# encoding: utf-8

require 'net/http'
require 'json'
require 'base64'
require 'nokogiri'

# BGG API用の設定
BGG_API_BASE = "https://boardgamegeek.com/xmlapi2"

# APIのエンドポイント
api_url = "http://localhost:8080/api/v1/games"

# 管理者の認証トークン
admin_tokens = {
  "access-token" => "Ypzsqs4fm6Xv0YIXqKvlkw",
  "token-type" => "Bearer",
  "client" => "16wkxgfIwTY73UuaH8amiw",
  "expiry" => "1743954292",
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

# BGGからHTML経由でトップ1000ゲームのIDを取得する関数
def fetch_bgg_top_games(start_rank = 101, end_rank = 1000, batch_size = 100)
  all_game_ids = []
  current_rank = start_rank

  puts "BGGのトップゲームリストを取得しています（#{start_rank}位〜#{end_rank}位）..."

  while current_rank <= end_rank
    end_batch = [current_rank + batch_size - 1, end_rank].min
    puts "#{current_rank}位〜#{end_batch}位を取得中..."

    url = "https://boardgamegeek.com/browse/boardgame/page/#{(current_rank / 100.0).ceil}"
    begin
      response = Net::HTTP.get(URI(url))
      html = Nokogiri::HTML(response)

      # ゲームIDを抽出
      game_links = html.css('tr#row_ td.collection_objectname a')
      
      batch_ids = []
      game_links.each do |link|
        href = link['href']
        if href && href.match(/\/boardgame\/(\d+)\//)
          game_id = $1
          batch_ids << game_id
        end
      end

      if batch_ids.empty?
        puts "警告: #{url} からゲームIDを取得できませんでした。"
      else
        puts "#{batch_ids.size}件のゲームIDを取得しました。"
        all_game_ids.concat(batch_ids)
      end
    rescue => e
      puts "エラー: #{url} の取得中にエラーが発生しました: #{e.message}"
    end

    # 次のバッチへ
    current_rank += batch_size
    
    # BGGへの負荷を減らすため1秒待機
    sleep(1)
  end

  # 重複を削除
  unique_ids = all_game_ids.uniq
  puts "合計#{unique_ids.size}件のユニークなゲームIDを取得しました。"
  
  return unique_ids
end

# BGG APIから直接トップランキングを取得する代替方法
def fetch_bgg_top_ranked_games(start_rank = 101, end_rank = 1000)
  all_game_ids = []
  
  begin
    # ボードゲームの上位からIDを取得
    url = "#{BGG_API_BASE}/hot?type=boardgame"
    response = Net::HTTP.get(URI(url))
    xml = Nokogiri::XML(response)
    
    xml.css("item").each do |item|
      id = item["id"]
      all_game_ids << id if id
    end
    
    puts "BGG APIから#{all_game_ids.size}件のホットゲームIDを取得しました。"
  rescue => e
    puts "エラー: BGG APIからのデータ取得中にエラーが発生しました: #{e.message}"
  end
  
  # APIからランキングリストが取得できなかった場合は、手動でIDリストを用意
  if all_game_ids.empty?
    puts "API取得に失敗したため、手動で定義したIDリストを使用します。"
    # 人気ゲーム約100件のIDリスト（実際には登録予定数より多めに用意）
    all_game_ids = [
      "178900", # 五つの王国（Five Kingdoms / Kingdoms）
      "171131", # 東京ハイウェイ
      "205637", # Orleans
      "146021", # Eldritch Horror
      "150376", # Dead of Winter
      "157354", # Five Tribes
      "213460", # Concordia Salsa
      "128621", # Keyflower
      "40692",  # Small World
      "68448",  # 7 Wonders
      "30549",  # Pandemic
      "132531", # Roll for the Galaxy
      "37111",  # Battlestar Galactica
      "9209",   # Ticket to Ride
      "2651",   # Power Grid
      "36218",  # Dominion
      "463",    # Carcassonne
      "478",    # Citadels
      "822",    # Caylus
      "13",     # Catan
      "171623", # The Gallerist
      "164928", # Viticulture
      "199792", # Tapestry
      "233078", # Twilight Imperium Fourth Edition
      "220308", # Gaia Project
      "317985", # Beyond the Sun
      "312484", # Lost Ruins of Arnak
      "224517", # Brass: Birmingham
      "266192", # Wingspan
      "167791", # Terraforming Mars
      "169786", # Scythe
      "174430", # Gloomhaven
      "342942", # Ark Nova
      "291457", # Gloomhaven: Jaws of the Lion
      "162886", # Spirit Island
      "187645", # Star Wars: Rebellion
      "233867", # Clank! In! Space!
      "172818", # Grand Austria Hotel
      "284083", # The Crew: Mission Deep Sea
      "290236", # Marvel Champions
      "205059", # Mansions of Madness 2nd Edition
      "209010", # Mechs vs. Minions
      "285967", # Paladins of the West Kingdom
      "124361", # Concordia
      "180263", # Viticulture Essential Edition
      "233741", # Quacks of Quedlinburg
      "167355", # Nemesis
      "221107", # Pandemic Legacy: Season 2
      "285774", # Marvel Champions: The Card Game
      "276025", # Sleeping Gods
      "161936", # Pandemic Legacy: Season 1
      "120677", # Terra Mystica
      "197405", # Everdell
      "295486", # Trajan
      "192921", # Everdell
      "125618", # Terra Mystica
      "3076",   # Puerto Rico
      "182028", # Through the Ages: A New Story of Civilization
      "159675", # Fields of Arle
      "229853", # Teotihuacan: City of Gods
      "237182", # Root
      "143884", # Caverna: The Cave Farmers
      "170216", # Blood Rage
      "102680", # Dungeon Petz
      "126163", # Pandemic: Iberia
      "281549", # Dinosaur Island
      "247763", # Underwater Cities
      "201808", # Clank! A Deck-Building Adventure
      "256997", # Azul: Stained Glass of Sintra
      "230802", # Azul
      "178570", # T.I.M.E Stories
      "167791", # Terraforming Mars
      "214879", # Fog of Love
      "288169", # Forgotten Waters
      "276181", # Aeon's End: Legacy
      "177478", # Dead of Winter: The Long Night
      "102548", # Dungeon Lords
      "110327", # Lords of Waterdeep
      "139952", # Pathfinder Adventure Card Game
      "31481",  # Galaxy Trucker
      "104162", # Mage Knight Board Game
      "70323",  # King of Tokyo
      "148228", # Splendor
      "185343", # Forbidden Stars
      "175914", # Food Chain Magnate
      "31260",  # Agricola
      "822",    # Caylus
      "36345",  # Dominion: Intrigue
      "2651",   # Power Grid
      "93",     # El Grande
      "12342",  # Ticket to Ride: Europe
      "521",    # Crokinole
      "266810", # Wingspan
      "239188", # Architects of the West Kingdom
      "164153", # Star Wars: Imperial Assault
      "173346", # 7 Wonders Duel
      "173346", # 7 Wonders Duel
      "209685", # Mechs vs. Minions
      "262712", # Brass: Birmingham
    ]
    
    # リストの範囲を制限
    all_game_ids = all_game_ids.slice(start_rank - 101, end_rank - start_rank + 1)
  end
  
  # 重複を削除
  unique_ids = all_game_ids.uniq
  puts "合計#{unique_ids.size}件のユニークなゲームIDを取得しました。"
  
  return unique_ids
end

# BGGのランキングデータを取得
puts "BGGの#{ARGV[0] || 101}位から#{ARGV[1] || 1000}位までのゲームを取得します..."
start_rank = (ARGV[0] || 101).to_i
end_rank = (ARGV[1] || 1000).to_i

game_ids = []

# まずはRanking APIから取得を試みる
begin
  game_ids = fetch_bgg_top_ranked_games(start_rank, end_rank)
rescue => e
  puts "ランキングAPI取得エラー: #{e.message}"
  puts "代替方法でゲームIDを取得します..."
end

# APIから十分なデータが取得できなかった場合はWebスクレイピングを試みる
if game_ids.size < (end_rank - start_rank) * 0.5
  puts "APIから十分なデータを取得できませんでした。Webページから直接取得を試みます..."
  begin
    game_ids = fetch_bgg_top_games(start_rank, end_rank)
  rescue => e
    puts "Webスクレイピングでもエラーが発生しました: #{e.message}"
  end
end

# どちらの方法でも十分なIDが取得できなかった場合
if game_ids.empty?
  puts "ゲームIDを取得できませんでした。スクリプトを終了します。"
  exit 1
end

puts "登録対象のゲーム数: #{game_ids.size}件"

# バッチ処理の設定
batch_size = 50  # 一度に処理するゲーム数
total_batches = (game_ids.size.to_f / batch_size).ceil
current_batch = 1

# バッチごとに処理
game_ids.each_slice(batch_size) do |batch_ids|
  puts "\n====== バッチ #{current_batch}/#{total_batches} を処理中 ======="
  
  # バッチ内の各ゲームを処理
  batch_ids.each_with_index do |bgg_id, index|
    batch_index = (current_batch - 1) * batch_size + index + 1
    puts "#{batch_index}/#{game_ids.size}. ゲームID #{bgg_id} を登録中..."
    
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
      auto_register: true  # 自動登録フラグを有効化
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
    sleep(1) unless index == batch_ids.size - 1
  end
  
  # バッチごとの進捗状況を表示
  puts "\n----- バッチ #{current_batch}/#{total_batches} 完了 -----"
  puts "現在の成功: #{stats[:success]}"
  puts "現在の既存: #{stats[:already_exists]}"
  puts "現在の失敗: #{stats[:failed]}"
  
  # バッチ間の待機時間
  if current_batch < total_batches
    puts "次のバッチを開始するまで30秒待機します..."
    sleep(30)
  end
  
  current_batch += 1
end

# 最終結果を表示
puts "\n======= 登録結果 ======="
puts "成功: #{stats[:success]}"
puts "既に登録済み: #{stats[:already_exists]}"
puts "失敗: #{stats[:failed]}"

if failed_games.any?
  puts "\n失敗したゲームID:"
  failed_games.each { |id| puts "- #{id}" }
end

# システムレビューの更新を促すメッセージ
puts "\n登録が完了しました。必要に応じて、以下のコマンドでシステムレビューを更新できます:"
puts "docker-compose exec api rails reviews:update_all_system_reviews"
