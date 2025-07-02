puts "Extended BGG Browse Page Range Test:"
puts "=" * 50

# 1-10（既に確認済み）
puts "Testing pages 1-10 (already confirmed working):"
(1..10).each do |page|
  games = BggService.get_top_games_from_browse(page)
  if games.any?
    puts "  Page #{page}: ✅ #{games.count} games (#{games.first[:rank]}-#{games.last[:rank]})"
  else
    puts "  Page #{page}: ❌ No games"
  end
  sleep(1)
end

puts ""
puts "Testing higher pages (11-30):"

# 11-30の範囲をテスト
(11..30).each do |page|
  games = BggService.get_top_games_from_browse(page)
  if games.any?
    puts "  Page #{page}: ✅ #{games.count} games (#{games.first[:rank]}-#{games.last[:rank]})"
  else
    puts "  Page #{page}: ❌ No games"
  end
  sleep(2) # 高いページ番号では少し長めの待機時間
end 