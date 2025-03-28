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

# BGGからHTML経由でトップ1000ゲームのIDを取得する関数
def fetch_bgg_top_games(start_rank = 1, end_rank = 1000, batch_size = 100)
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
          name = link.text.strip
          # 取得したランクも一緒に保存
          rank_element = link.ancestors('tr').css('td.collection_rank').first
          rank = rank_element ? rank_element.text.strip.to_i : 0
          batch_ids << {id: game_id, name: name, rank: rank}
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
    current_rank = end_batch + 1
    
    # BGGへの負荷を減らすため1秒待機
    sleep(1)
  end

  # 重複を削除
  unique_ids = all_game_ids.uniq {|game| game[:id]}
  puts "合計#{unique_ids.size}件のユニークなゲームIDを取得しました。"
  
  return unique_ids
end

# APIで登録済みのゲームを確認する関数
def check_registered_games(game_ids)
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
# パラメータの取得（コマンドライン引数またはデフォルト値）
start_rank = (ARGV[0] || 1).to_i
end_rank = (ARGV[1] || 1000).to_i

# BGGからランキングデータを取得
puts "BGGの#{start_rank}位から#{end_rank}位までのゲームを取得します..."
game_list = fetch_bgg_top_games(start_rank, end_rank)

if game_list.empty?
  puts "ゲームIDを取得できませんでした。スクリプトを終了します。"
  exit 1
end

# 登録状況を確認
registered, unregistered = check_registered_games(game_list)

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
puts "ruby register_bgg_top1000.rb #{start_rank} #{end_rank}" 