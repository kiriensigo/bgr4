puts "BGG Browse Page Range Test:"
puts "=" * 40

test_pages = [5, 6, 7, 8, 9, 10, 11, 15, 20, 25]

test_pages.each do |page|
  puts "Testing page #{page}..."
  games = BggService.get_top_games_from_browse(page)
  if games.any?
    puts "  ✅ #{games.count} games found"
    puts "  📍 Range: #{games.first[:rank]} - #{games.last[:rank]}"
  else
    puts "  ❌ No games found"
  end
  sleep(1) # Rate limiting
end 