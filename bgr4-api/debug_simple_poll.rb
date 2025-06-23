require 'rexml/document'

puts "=== シンプルなプレイ人数デバッグ ==="

# 既知のXML文字列を使用（出力で確認）
xml_content = '<?xml version="1.0" encoding="utf-8"?>
<items>
  <item type="boardgame" id="316554">
    <poll name="suggested_numplayers" title="User Suggested Number of Players" totalvotes="1479">
      <results numplayers="1">
        <result value="Best" numvotes="74" />
        <result value="Recommended" numvotes="571" />
        <result value="Not Recommended" numvotes="381" />
      </results>
      <results numplayers="2">
        <result value="Best" numvotes="68" />
        <result value="Recommended" numvotes="716" />
        <result value="Not Recommended" numvotes="355" />
      </results>
      <results numplayers="3">
        <result value="Best" numvotes="851" />
        <result value="Recommended" numvotes="400" />
        <result value="Not Recommended" numvotes="24" />
      </results>
      <results numplayers="4">
        <result value="Best" numvotes="824" />
        <result value="Recommended" numvotes="354" />
        <result value="Not Recommended" numvotes="56" />
      </results>
      <results numplayers="4+">
        <result value="Best" numvotes="0" />
        <result value="Recommended" numvotes="7" />
        <result value="Not Recommended" numvotes="578" />
      </results>
    </poll>
  </item>
</items>'

puts "XMLをパース中..."
doc = REXML::Document.new(xml_content)
item = doc.elements['items/item']

puts "投票情報を検索中..."

# XPathでプレイ人数投票を取得
poll_results = item.elements.to_a('poll[@name="suggested_numplayers"]/results')
puts "見つかった投票結果数: #{poll_results.size}"

best_num_players = []
recommended_num_players = []

poll_results.each_with_index do |result, index|
  num_players = result.attributes['numplayers']
  puts "\n--- #{num_players}人の結果 ---"
  
  votes = result.elements.to_a('result')
  
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
  if total_votes > 0
    # Bestが最も多い票を獲得している場合
    if best_votes > recommended_votes && best_votes > not_recommended_votes
      best_num_players << num_players
      puts "  → Best判定"
    end
    
    # Best + Recommendedの合計がNot Recommendedより多い場合は推奨とする
    if (best_votes + recommended_votes) > not_recommended_votes
      recommended_num_players << num_players
      puts "  → Recommended判定"
    end
  end
end

puts "\n=== 最終結果 ==="
puts "Best Players: #{best_num_players}"
puts "Recommended Players: #{recommended_num_players}" 