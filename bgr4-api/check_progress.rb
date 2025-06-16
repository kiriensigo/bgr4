total = Game.count
translated = Game.where.not(japanese_description: nil).count
remaining = Game.where(japanese_description: nil).where.not(description: nil).count

puts "Total games: #{total}"
puts "Translated: #{translated}"
puts "Remaining: #{remaining}"
puts "Progress: #{((translated.to_f / total) * 100).round(1)}%" 