puts "Current database stats:"
puts "Total games: #{Game.count}"
puts ""

puts "Rank distribution:"
[1..100, 101..200, 201..300, 301..400, 401..500, 501..600, 601..700, 701..800, 801..900, 901..1000].each_with_index do |range, idx|
  count = Game.where(rank: range).count
  puts "#{(idx*100)+1}-#{(idx+1)*100}: #{count} games"
end

puts ""
puts "Games without rank: #{Game.where(rank: nil).count}"

# 1001位以降の確認
higher_ranks = Game.where('rank > 1000').count
puts "Games ranked 1001+: #{higher_ranks}" 