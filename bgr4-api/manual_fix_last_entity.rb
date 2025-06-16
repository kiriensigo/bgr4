# 最後に残った特定のHTMLエンティティを手動で処理するスクリプト

game = Game.find_by(bgg_id: 341169)

puts "=== Great Western Trail: Second Edition の手動修正 ==="
puts "処理前:"
puts game.japanese_description
puts "\n" + "="*50 + "\n"

# 手動でHTMLエンティティを置換
fixed_description = game.japanese_description.dup

# &#quot; を " に置換（連続するものも含む）
fixed_description.gsub!(/&#quot;/, '"')

# その他の残っているエンティティも処理
fixed_description.gsub!(/&#10;?/, "\n")
fixed_description.gsub!(/&#13;?/, "\r")
fixed_description.gsub!(/&amp;?/, "&")
fixed_description.gsub!(/&lt;?/, "<")
fixed_description.gsub!(/&gt;?/, ">")
fixed_description.gsub!(/&#39;?/, "'")

# 連続する改行を整理
fixed_description.gsub!(/\n{3,}/, "\n\n")

# 前後の空白を除去
fixed_description.strip!

# 末尾のセミコロンを除去
fixed_description.gsub!(/[;；]+\s*$/, "")

# 再度前後の空白を除去
fixed_description.strip!

# 更新
game.update(japanese_description: fixed_description)

puts "処理後:"
puts game.japanese_description

puts "\n=== 手動修正完了 ===" 