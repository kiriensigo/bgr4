# 進捗確認
total = Game.count
with_japanese = Game.where.not(japanese_name: [nil, '']).count
without_japanese = Game.where(japanese_name: [nil, '']).count

puts "=== 進捗確認 #{Time.current} ==="
puts "総ゲーム数: #{total}"
puts "日本語名あり: #{with_japanese}"
puts "日本語名なし: #{without_japanese}"
puts "進捗率: #{(with_japanese.to_f / total * 100).round(1)}%"

if with_japanese > 6
  puts "\n🎉 新しく追加された日本語名（最新5件）:"
  Game.where.not(japanese_name: [nil, '']).order(updated_at: :desc).limit(5).each do |game|
    puts "#{game.name} → #{game.japanese_name}"
  end
end 