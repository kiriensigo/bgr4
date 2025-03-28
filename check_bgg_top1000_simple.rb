#!/usr/bin/env ruby
# encoding: utf-8

require 'net/http'
require 'json'
require 'httparty'

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

# BGG APIでゲーム情報を取得する関数
def fetch_bgg_top_games_api(ranks = 100)
  puts "BGGのAPIからトップ#{ranks}ゲームを取得しています..."
  
  # ゲーム情報を格納する配列
  games = []
  
  # BGG APIのURL
  url = "#{BGG_API_BASE}/hot?type=boardgame"
  
  begin
    response = Net::HTTP.get(URI(url))
    if response.include?('<item ')
      # 簡易的なXML解析（実際はパーサーを使うべき）
      response.scan(/<item id="(\d+)".*?name value="([^"]+)"/).each_with_index do |(id, name), index|
        if index < ranks
          games << {id: id, name: name, rank: index + 1}
        end
      end
      puts "BGG APIから#{games.size}件のゲーム情報を取得しました。"
    else
      puts "BGG APIからの応答が予期しない形式です。"
    end
  rescue => e
    puts "BGG APIへのアクセス中にエラーが発生しました: #{e.message}"
  end
  
  return games
end

# APIで登録済みのゲームを確認する関数
def check_registered_games(game_ids, admin_tokens)
  registered_games = []
  unregistered_games = []
  
  puts "登録済みのゲームを確認しています..."
  
  # ゲームIDの配列をバッチに分ける
  batch_size = 50
  game_ids.each_slice(batch_size) do |batch|
    puts "#{batch.size}件のゲームをチェック中..."
    
    batch.each do |game|
      bgg_id = game[:id]
      
      # APIでゲームの存在を確認
      uri = URI("http://localhost:8080/api/v1/games/#{bgg_id}")
      http = Net::HTTP.new(uri.host, uri.port)
      request = Net::HTTP::Get.new(uri)
      
      # ヘッダー設定
      request["Accept"] = "application/json"
      
      # リクエスト送信
      begin
        response = http.request(request)
        
        case response.code
        when "200"
          # ゲームが存在する
          registered_games << game
        when "404"
          # ゲームが存在しない
          unregistered_games << game
        else
          # その他のエラー（念のため未登録扱い）
          puts "⚠️ ID: #{bgg_id} の確認でエラー: #{response.code}"
          unregistered_games << game
        end
      rescue => e
        puts "❌ ID: #{bgg_id} の確認で例外発生: #{e.message}"
        unregistered_games << game
      end
      
      # APIへの負荷軽減
      sleep(0.2)
    end
  end
  
  return registered_games, unregistered_games
end

# メイン処理
limit = (ARGV[0] || 100).to_i

# BGGからトップゲームを取得
game_list = fetch_bgg_top_games_api(limit)

if game_list.empty?
  puts "ゲームリストを取得できませんでした。スクリプトを終了します。"
  exit 1
end

# 登録状況を確認
registered, unregistered = check_registered_games(game_list, admin_tokens)

# 結果表示
puts "\n====== 確認結果 ======="
puts "チェックしたゲーム数: #{game_list.size}"
puts "登録済みゲーム数: #{registered.size}"
puts "未登録ゲーム数: #{unregistered.size}"

# 未登録ゲームのリストを表示
if unregistered.any?
  puts "\n未登録ゲーム一覧:"
  unregistered.sort_by {|g| g[:rank]}.each do |game|
    puts "#{game[:rank]}位: #{game[:name]} (ID: #{game[:id]})"
  end
  
  # 未登録ゲームのIDだけのリストも表示（登録用）
  puts "\n未登録ゲームID一覧（コピペ用）:"
  unregistered_ids = unregistered.map {|g| "\"#{g[:id]}\"" }.join(", ")
  puts "[#{unregistered_ids}]"
end

puts "\n登録コマンド例:"
puts "ruby register_bgg_top1000.rb [BGG_ID1 BGG_ID2 ...]" 