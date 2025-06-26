#!/usr/bin/env ruby

require_relative 'config/environment'
require 'nokogiri'
require 'httparty'

# BGGランキングページからの取得テスト
def test_bgg_ranking_fetch
  puts "🧪 BGGランキングページ取得テスト"
  puts "=" * 50
  
  url = "https://boardgamegeek.com/browse/boardgame/page/1?sort=rank"
  puts "📡 URL: #{url}"
  
  response = HTTParty.get(url, {
    headers: {
      'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 30
  })
  
  puts "📊 レスポンス: #{response.code}"
  
  if response.code == 200
    doc = Nokogiri::HTML(response.body)
    puts "✅ HTML解析成功"
    
    games = []
    rank_count = 0
    
    # テーブル行を確認
    doc.css('tr').each_with_index do |row, index|
      cells = row.css('td')
      next if cells.empty?
      
      # ランク列（最初の列）を確認
      rank_cell = cells.first
      rank_text = rank_cell.text.strip
      
      # 数字のみの行を探す
      if rank_text.match?(/^\d+$/)
        rank_count += 1
        rank = rank_text.to_i
        
        # タイトル列（3番目の列）を確認
        if cells.size >= 3
          title_cell = cells[2]
          link = title_cell.css('a').first
          
          if link
            href = link['href']
            title = link.text.strip
            
            # BGG IDを抽出
            if href && href.match(%r{/boardgame/(\d+)/})
              bgg_id = $1
              # 年を除去
              clean_title = title.gsub(/\s*\(\d{4}\)\s*$/, '')
              
              games << {
                rank: rank,
                bgg_id: bgg_id,
                title: clean_title,
                original_title: title
              }
              
              # 最初の10件だけ表示
              if games.size <= 10
                puts "#{rank}位: #{clean_title} (BGG ID: #{bgg_id})"
              end
            end
          end
        end
      end
      
      # 最初の200行だけ処理
      break if index >= 200
    end
    
    puts "\n📊 結果:"
    puts "  ランク行数: #{rank_count}"
    puts "  ゲーム抽出数: #{games.size}"
    
    if games.size >= 90 # ページあたり100件期待
      puts "  ✅ 十分なデータを抽出"
    else
      puts "  ⚠️  期待より少ないデータ (期待: ~100件)"
    end
    
    # トップ3の詳細確認
    puts "\n🏆 トップ3詳細:"
    games.first(3).each do |game|
      puts "  #{game[:rank]}位: #{game[:title]} (BGG ID: #{game[:bgg_id]})"
    end
    
  else
    puts "❌ HTTP エラー: #{response.code}"
  end
end

test_bgg_ranking_fetch 