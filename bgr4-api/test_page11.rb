puts "Page 11 test:"
games = BggService.get_top_games_from_browse(11)
puts "Count: #{games.count}"
if games.any?
  puts "First: #{games.first}"
  puts "Last: #{games.last}"
else
  puts "No games found"
end 