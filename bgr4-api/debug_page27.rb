require 'open-uri'
require 'nokogiri'

puts "Debugging BGG page 27..."

begin
  url = "https://boardgamegeek.com/browse/boardgame/page/27?sort=rank&sortdir=asc"
  puts "URL: #{url}"
  
  response = HTTParty.get(url, 
    headers: {
      'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language' => 'en-US,en;q=0.9'
    },
    timeout: 30
  )
  
  puts "Response code: #{response.code}"
  puts "Content length: #{response.body.length}"
  
  doc = Nokogiri::HTML(response.body)
  
  # テーブルを探す
  puts "\n=== TABLE ELEMENTS ==="
  doc.css('table').each_with_index do |table, idx|
    classes = table['class'] || 'no-class'
    rows = table.css('tr').length
    puts "Table #{idx}: class='#{classes}', rows=#{rows}"
  end
  
  # IDやクラスにgameやrankが含まれる要素を探す
  puts "\n=== GAME/RANK RELATED ELEMENTS ==="
  ['game', 'rank', 'collection', 'browse'].each do |keyword|
    elements = doc.css("[class*='#{keyword}'], [id*='#{keyword}']")
    puts "Elements with '#{keyword}': #{elements.length}"
    elements.first(3).each do |el|
      puts "  #{el.name} class='#{el['class']}' id='#{el['id']}'"
    end
  end
  
  # ページの主要構造を確認
  puts "\n=== PAGE STRUCTURE ==="
  main_content = doc.at_css('body')
  if main_content
    # 最初のいくつかの子要素を表示
    main_content.children.select(&:element?).first(10).each do |child|
      puts "#{child.name} class='#{child['class']}' id='#{child['id']}'"
    end
  end
  
  # もしページリンクがあれば
  puts "\n=== PAGINATION LINKS ==="
  page_links = doc.css('a[href*="page/"]')
  puts "Page links found: #{page_links.length}"
  page_links.first(5).each do |link|
    puts "  #{link.text.strip} -> #{link['href']}"
  end
  
rescue => e
  puts "Error: #{e.message}"
  puts e.backtrace.first(3)
end 