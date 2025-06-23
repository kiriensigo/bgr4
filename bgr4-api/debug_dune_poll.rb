# Dune: ImperiumのBGG投票情報デバッグ
require 'net/http'
require 'uri'
require 'rexml/document'

puts "=== Dune: Imperium BGG投票情報デバッグ ==="

# BGGからXMLを直接取得
url = "https://boardgamegeek.com/xmlapi2/thing?id=316554&stats=1"
uri = URI.parse(url)
response = Net::HTTP.get_response(uri)

if response.code != '200'
  puts "BGGからのレスポンスエラー: #{response.code}"
  exit
end

puts "BGGから正常にデータを取得しました"

# XMLをパース
doc = REXML::Document.new(response.body)
item = doc.elements['items/item']

if item.nil?
  puts "アイテム要素が見つかりません"
  exit
end

puts "\n=== プレイ人数投票情報 ==="

# 投票情報を確認
poll_results = item.elements.to_a('.//poll[@name="suggested_numplayers"]/results')
puts "見つかった投票結果数: #{poll_results.size}"

poll_results.each_with_index do |result, index|
  num_players = result.attributes['numplayers']
  puts "\n--- 結果 #{index + 1}: #{num_players}人 ---"
  
  votes = result.elements.to_a('.//result')
  
  best_votes = 0
  recommended_votes = 0
  not_recommended_votes = 0
  
  votes.each do |vote|
    case vote.attributes['value']
    when 'Best'
      best_votes = vote.attributes['numvotes'].to_i
      puts "  Best: #{best_votes}票"
    when 'Recommended'
      recommended_votes = vote.attributes['numvotes'].to_i
      puts "  Recommended: #{recommended_votes}票"
    when 'Not Recommended'
      not_recommended_votes = vote.attributes['numvotes'].to_i
      puts "  Not Recommended: #{not_recommended_votes}票"
    end
  end
  
  total_votes = best_votes + recommended_votes + not_recommended_votes
  puts "  合計: #{total_votes}票"
  
  # 判定ロジックをテスト
  puts "  判定結果:"
  if total_votes > 0
    if best_votes > recommended_votes && best_votes > not_recommended_votes
      puts "    → Best"
    end
    
    if (best_votes + recommended_votes) > not_recommended_votes
      puts "    → Recommended"
    end
  end
end

puts "\n=== BggServiceのメソッドを使用してテスト ==="
bgg_data = BggService.get_game_details("316554")
puts "Best Players: #{bgg_data[:best_num_players]}"
puts "Recommended Players: #{bgg_data[:recommended_num_players]}" 