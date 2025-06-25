#!/usr/bin/env ruby
require_relative 'config/environment'

puts "=== Palm Island (棕櫚島) チェック ==="

# BGG ID: 239464のゲームを検索
game = Game.find_by(bgg_id: 239464)

if game
  puts "ゲーム発見:"
  puts "  ID: #{game.id}"
  puts "  名前: #{game.name}"
  puts "  日本語名: #{game.japanese_name || 'なし'}"
  puts "  BGG ID: #{game.bgg_id}"
  puts "  登録済み: #{game.registered_on_site}"
  puts ""
  
  # 現在の日本語名が中国語かどうかチェック
  if game.japanese_name.present?
    puts "=== 現在の日本語名の言語判定 ==="
    result = LanguageDetectionService.detect_language(game.japanese_name)
    is_chinese = LanguageDetectionService.chinese?(game.japanese_name)
    analysis = LanguageDetectionService.analyze_text(game.japanese_name)
    
    puts "判定結果: #{result}"
    puts "中国語か: #{is_chinese}"
    puts "詳細: #{analysis[:details]}"
    puts ""
    
    if is_chinese
      puts "⚠️  現在の日本語名「#{game.japanese_name}」は中国語として判定されました！"
      puts "このゲームの日本語名をnilにリセットする必要があります。"
      puts ""
      
      # 日本語名をnilにリセット
      puts "日本語名をリセット中..."
      game.update!(japanese_name: nil)
      puts "✅ 日本語名をnilにリセットしました"
    else
      puts "✅ 現在の日本語名は中国語ではありません"
    end
  else
    puts "ℹ️  日本語名は設定されていません"
  end
  
  # BGGから正しい日本語バージョン情報を再取得
  puts "\n=== BGGから日本語バージョン情報を再取得 ==="
  japanese_info = BggService.get_japanese_version_info(game.bgg_id)
  
  if japanese_info && japanese_info[:name].present?
    new_name = japanese_info[:name]
    puts "BGGから取得した名前: #{new_name}"
    
    # 新しい名前の言語判定
    new_result = LanguageDetectionService.detect_language(new_name)
    new_is_chinese = LanguageDetectionService.chinese?(new_name)
    puts "新しい名前の判定: #{new_result} (中国語: #{new_is_chinese})"
    
    if new_is_chinese
      puts "❌ BGGから取得した名前も中国語です。日本語版は存在しない可能性があります。"
    else
      puts "✅ BGGから取得した名前は中国語ではありません"
      if new_name.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
        puts "✅ 日本語文字が含まれています"
        game.update!(japanese_name: new_name)
        puts "✅ 日本語名を更新しました: #{new_name}"
      else
        puts "❌ 日本語文字が含まれていません"
      end
    end
  else
    puts "❌ BGGから日本語バージョン情報を取得できませんでした"
  end
  
else
  puts "❌ BGG ID: 239464のゲームが見つかりません"
end

puts "\n=== テスト: 各種中国語パターンの判定 ==="
test_names = [
  "棕櫚島",           # 繁体字中国語
  "棕榈岛",           # 簡体字中国語（仮想）
  "パームアイランド",   # 日本語カタカナ
  "Palm Island",      # 英語
  "ぱーむあいらんど"   # 日本語ひらがな
]

test_names.each do |name|
  result = LanguageDetectionService.detect_language(name)
  is_chinese = LanguageDetectionService.chinese?(name)
  puts "#{name}: #{result} (中国語: #{is_chinese})"
end 