# 日本語説明文がないゲームの確認と翻訳実行スクリプト

puts "=== 翻訳状況確認 ==="

# 全ゲーム数
total_games = Game.count
puts "全ゲーム数: #{total_games}"

# 説明文があるゲーム数
games_with_description = Game.where.not(description: nil).count
puts "説明文があるゲーム数: #{games_with_description}"

# 日本語説明文があるゲーム数
games_with_japanese_description = Game.where.not(japanese_description: nil).count
puts "日本語説明文があるゲーム数: #{games_with_japanese_description}"

# 日本語説明文がないゲーム数
games_without_japanese_description = Game.where(japanese_description: nil).where.not(description: nil).count
puts "日本語説明文がないゲーム数: #{games_without_japanese_description}"

# DeepL APIキーの確認
if ENV['DEEPL_API_KEY'].present?
  puts "DeepL APIキー: 設定済み"
else
  puts "DeepL APIキー: 未設定"
  exit 1
end

puts "\n=== 翻訳実行 ==="

if games_without_japanese_description > 0
  puts "#{games_without_japanese_description}件のゲームの説明文を翻訳します..."
  
  # 翻訳対象のゲームを取得
  games_to_translate = Game.where(japanese_description: nil).where.not(description: nil).limit(10)
  
  games_to_translate.each_with_index do |game, index|
    puts "#{index + 1}/#{games_to_translate.count}: #{game.name} (BGG ID: #{game.bgg_id})"
    
    begin
      # 説明文に日本語が含まれているかチェック
      if game.description.match?(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
        # 既に日本語が含まれている場合はそのまま使用
        game.update(japanese_description: game.description)
        puts "  既に日本語の説明文が含まれています。そのまま使用します。"
      else
        # 日本語が含まれていない場合は翻訳を試みる
        japanese_description = DeeplTranslationService.translate(game.description)
        
        if japanese_description.present?
          game.update(japanese_description: japanese_description)
          puts "  翻訳完了: #{japanese_description[0..100]}..."
        else
          puts "  翻訳に失敗しました"
        end
      end
    rescue => e
      puts "  エラー: #{e.message}"
    end
    
    # APIの制限を考慮して少し待機
    sleep(2)
  end
  
  puts "\n翻訳処理完了！"
else
  puts "翻訳が必要なゲームはありません。"
end 