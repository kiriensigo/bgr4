puts "Page 27 test (2601-2700位):"
games = BggService.get_top_games_from_browse(27)
puts "Count: #{games.count}"
if games.any?
  puts "First: #{games.first}"
  puts "Last: #{games.last}"
  puts "Sample games:"
  games.first(5).each_with_index do |game, idx|
    puts "  #{idx+1}. #{game[:name]} (BGG ID: #{game[:bgg_id]}, Rank: #{game[:rank]})"
  end
else
  puts "No games found"
end 