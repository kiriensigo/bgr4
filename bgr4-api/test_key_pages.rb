puts "Key BGG Browse Pages Test:"
puts "=" * 40

test_pages = [10, 11, 15, 20, 25, 27, 30]

test_pages.each do |page|
  puts "Testing page #{page}..."
  games = BggService.get_top_games_from_browse(page)
  if games.any?
    expected_start = ((page - 1) * 100) + 1
    expected_end = page * 100
    puts "  ✅ #{games.count} games found"
    puts "  📍 Expected: #{expected_start}-#{expected_end}"
    puts "  📍 Actual: #{games.first[:rank]}-#{games.last[:rank]}"
    puts "  🎲 First game: #{games.first[:name]}"
  else
    puts "  ❌ No games found"
  end
  puts ""
  sleep(2)
end 