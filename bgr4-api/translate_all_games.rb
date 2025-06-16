# 全ゲームの日本語説明文翻訳スクリプト

puts "=== 全ゲーム翻訳開始 ==="

# 翻訳対象のゲームを取得（日本語説明文がないもの）
games_to_translate = Game.where(japanese_description: nil).where.not(description: nil)
total_count = games_to_translate.count

puts "翻訳対象ゲーム数: #{total_count}"

if total_count == 0
  puts "翻訳が必要なゲームはありません。"
  exit 0
end

# DeepL APIキーの確認
unless ENV['DEEPL_API_KEY'].present?
  puts "エラー: DeepL APIキーが設定されていません。"
  exit 1
end

success_count = 0
error_count = 0
already_japanese_count = 0

games_to_translate.each_with_index do |game, index|
  puts "\n#{index + 1}/#{total_count}: #{game.name} (BGG ID: #{game.bgg_id})"
  
  begin
    # 説明文に日本語が含まれているかチェック
    if game.description.match?(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
      # 既に日本語が含まれている場合はそのまま使用
      game.update(japanese_description: game.description)
      puts "  ✓ 既に日本語の説明文が含まれています。"
      already_japanese_count += 1
    else
      # 日本語が含まれていない場合は翻訳を試みる
      puts "  翻訳中..."
      japanese_description = DeeplTranslationService.translate(game.description)
      
      if japanese_description.present?
        game.update(japanese_description: japanese_description)
        puts "  ✓ 翻訳完了: #{japanese_description[0..50]}..."
        success_count += 1
      else
        puts "  ✗ 翻訳に失敗しました"
        error_count += 1
      end
    end
  rescue => e
    puts "  ✗ エラー: #{e.message}"
    error_count += 1
  end
  
  # APIの制限を考慮して少し待機（10件ごとに長めの休憩）
  if (index + 1) % 10 == 0
    puts "  --- 10件処理完了。30秒休憩します ---"
    sleep(30)
  else
    sleep(3)
  end
end

puts "\n=== 翻訳処理完了 ==="
puts "成功: #{success_count}件"
puts "既に日本語: #{already_japanese_count}件"
puts "エラー: #{error_count}件"
puts "合計: #{success_count + already_japanese_count + error_count}件"

# 最終確認
final_count = Game.where.not(japanese_description: nil).count
puts "\n日本語説明文があるゲーム数: #{final_count}/#{Game.count}" 