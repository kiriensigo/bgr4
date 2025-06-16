# 説明文のHTMLエンティティクリーンアップスクリプト

puts "=== 説明文クリーンアップ開始 ==="

# HTMLエンティティをクリーンアップするメソッド
def cleanup_html_entities(text)
  return nil if text.blank?
  
  # HTMLエンティティを適切な文字に変換
  cleaned_text = text.dup
  
  # 改行関連のエンティティを改行に変換
  cleaned_text.gsub!(/&#10;/, "\n")
  cleaned_text.gsub!(/&#13;/, "\r")
  cleaned_text.gsub!(/&lt;br&gt;/, "\n")
  cleaned_text.gsub!(/&lt;br\/&gt;/, "\n")
  cleaned_text.gsub!(/&lt;br \/&gt;/, "\n")
  
  # その他の一般的なHTMLエンティティを変換
  cleaned_text.gsub!(/&amp;/, "&")
  cleaned_text.gsub!(/&lt;/, "<")
  cleaned_text.gsub!(/&gt;/, ">")
  cleaned_text.gsub!(/&quot;/, '"')
  cleaned_text.gsub!(/&#39;/, "'")
  cleaned_text.gsub!(/&apos;/, "'")
  cleaned_text.gsub!(/&nbsp;/, " ")
  
  # 特殊文字のエンティティ
  cleaned_text.gsub!(/&ndash;/, "–")
  cleaned_text.gsub!(/&mdash;/, "—")
  cleaned_text.gsub!(/&hellip;/, "…")
  cleaned_text.gsub!(/&rsquo;/, "'")
  cleaned_text.gsub!(/&lsquo;/, "'")
  cleaned_text.gsub!(/&rdquo;/, """)
  cleaned_text.gsub!(/&ldquo;/, """)
  
  # アクセント付き文字
  cleaned_text.gsub!(/&eacute;/, "é")
  cleaned_text.gsub!(/&egrave;/, "è")
  cleaned_text.gsub!(/&ecirc;/, "ê")
  cleaned_text.gsub!(/&ouml;/, "ö")
  cleaned_text.gsub!(/&uuml;/, "ü")
  cleaned_text.gsub!(/&auml;/, "ä")
  cleaned_text.gsub!(/&aring;/, "å")
  cleaned_text.gsub!(/&ccedil;/, "ç")
  cleaned_text.gsub!(/&ntilde;/, "ñ")
  
  # 数値エンティティを文字に変換（基本的なもの）
  cleaned_text.gsub!(/&#(\d+);/) do |match|
    code = $1.to_i
    if code > 0 && code < 1114112  # Unicode範囲内
      [code].pack('U*')
    else
      match  # 変換できない場合はそのまま
    end
  end
  
  # 16進数エンティティを文字に変換
  cleaned_text.gsub!(/&#x([0-9a-fA-F]+);/) do |match|
    code = $1.to_i(16)
    if code > 0 && code < 1114112  # Unicode範囲内
      [code].pack('U*')
    else
      match  # 変換できない場合はそのまま
    end
  end
  
  # 連続する改行を整理
  cleaned_text.gsub!(/\n{3,}/, "\n\n")
  
  # 前後の空白を除去
  cleaned_text.strip
end

# 日本語説明文があるゲームを取得
games_with_japanese_description = Game.where.not(japanese_description: nil)
total_count = games_with_japanese_description.count

puts "クリーンアップ対象ゲーム数: #{total_count}"

if total_count == 0
  puts "クリーンアップが必要なゲームはありません。"
  exit 0
end

updated_count = 0
no_change_count = 0

games_with_japanese_description.each_with_index do |game, index|
  puts "\n#{index + 1}/#{total_count}: #{game.name} (BGG ID: #{game.bgg_id})"
  
  begin
    original_description = game.japanese_description
    cleaned_description = cleanup_html_entities(original_description)
    
    if cleaned_description != original_description
      game.update(japanese_description: cleaned_description)
      puts "  ✓ クリーンアップ完了"
      puts "  変更前: #{original_description[0..100]}..."
      puts "  変更後: #{cleaned_description[0..100]}..."
      updated_count += 1
    else
      puts "  - 変更なし"
      no_change_count += 1
    end
  rescue => e
    puts "  ✗ エラー: #{e.message}"
  end
end

puts "\n=== クリーンアップ処理完了 ==="
puts "更新: #{updated_count}件"
puts "変更なし: #{no_change_count}件"
puts "合計: #{updated_count + no_change_count}件" 