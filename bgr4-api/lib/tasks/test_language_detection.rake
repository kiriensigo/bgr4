namespace :language do
  desc "言語判定機能をテストする"
  task test: :environment do
    puts "言語判定機能のテストを開始します..."
    
    # テスト用のサンプルテキスト
    test_cases = [
      { text: "カタン", expected: :japanese },
      { text: "ドミニオン", expected: :japanese },
      { text: "ウイングスパン", expected: :japanese },
      { text: "卡坦岛", expected: :simplified_chinese },
      { text: "統治者", expected: :traditional_chinese },
      { text: "領土", expected: :japanese },  # 短い漢字は日本語として判定
      { text: "三国志大戦", expected: :japanese },
      { text: "农场主", expected: :simplified_chinese },
      { text: "Wingspan", expected: :english },
      { text: "農場經營", expected: :traditional_chinese },
    ]
    
    puts "\n=== テストケースの実行 ==="
    test_cases.each do |test_case|
      result = LanguageDetectionService.detect_language(test_case[:text])
      status = result == test_case[:expected] ? "✓ 正解" : "✗ 不正解"
      puts "#{test_case[:text]} → #{result} (期待値: #{test_case[:expected]}) #{status}"
    end
    
    puts "\n=== 実際のデータベースのゲーム名を分析 ==="
    # 実際のゲームデータを分析
    games_with_japanese_names = Game.where.not(japanese_name: [nil, ""])
                                    .limit(20)
                                    .includes(:reviews)
    
    puts "日本語名が設定されているゲーム（最大20件）の言語分析："
    
    games_with_japanese_names.each do |game|
      analysis = game.analyze_name_languages
      puts "\n--- #{game.name} (BGG ID: #{game.bgg_id}) ---"
      puts "日本語名: #{game.japanese_name}"
      puts "言語判定: #{analysis[:japanese_name][:analysis][:language]}"
      puts "スマート表示名: #{game.smart_display_name}"
      
      # 詳細分析を表示
      details = analysis[:japanese_name][:analysis][:details]
      puts "  ひらがな: #{details[:has_hiragana]}"
      puts "  カタカナ: #{details[:has_katakana]}"
      puts "  繁体字: #{details[:has_traditional_chinese]}"
      puts "  簡体字: #{details[:has_simplified_chinese]}"
      puts "  漢字: #{details[:has_chinese_chars]}"
      puts "  文字数: #{details[:length]}"
    end
    
    puts "\n=== 中国語と判定されたゲームの統計 ==="
    chinese_games = []
    
    Game.where.not(japanese_name: [nil, ""]).find_each do |game|
      if LanguageDetectionService.chinese?(game.japanese_name)
        chinese_games << {
          name: game.name,
          japanese_name: game.japanese_name,
          language: LanguageDetectionService.detect_language(game.japanese_name),
          bgg_id: game.bgg_id
        }
      end
    end
    
    puts "中国語と判定されたゲーム数: #{chinese_games.count}件"
    
    if chinese_games.any?
      puts "\n中国語と判定されたゲーム（最初の10件）:"
      chinese_games.first(10).each do |game|
        puts "  #{game[:name]} → #{game[:japanese_name]} (#{game[:language]})"
      end
    end
    
    puts "\n言語判定機能のテストが完了しました。"
  end
  
  desc "中国語と判定されたゲームの日本語名をクリアする"
  task clear_chinese_names: :environment do
    puts "中国語と判定されたゲームの日本語名をクリアします..."
    
    cleared_count = 0
    
    Game.where.not(japanese_name: [nil, ""]).find_each do |game|
      if LanguageDetectionService.chinese?(game.japanese_name)
        puts "クリア: #{game.name} (#{game.japanese_name})"
        game.update(japanese_name: nil)
        cleared_count += 1
      end
    end
    
    puts "#{cleared_count}件のゲームの日本語名をクリアしました。"
  end
end 