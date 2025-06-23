# 日本語名一括更新スクリプト
puts "=== 日本語名一括更新開始 ==="

# 日本語名が未設定のゲームを取得
games_without_japanese = Game.where(japanese_name: [nil, ''])
total_games = games_without_japanese.count

puts "処理対象: #{total_games}件のゲーム"
puts "開始時刻: #{Time.current}"

# 成功・失敗カウンター
success_count = 0
failure_count = 0
errors = []

# 各ゲームの日本語名を取得・更新
games_without_japanese.each_with_index do |game, index|
  begin
    puts "\n[#{index + 1}/#{total_games}] #{game.name} (BGG:#{game.bgg_id})"
    
    # BGGから日本語版情報を取得
    result = BggService.get_japanese_version_info(game.bgg_id)
    
    if result && result.is_a?(Hash) && result[:name] && !result[:name].strip.empty?
      japanese_name = result[:name].strip
      
      # データベースに保存
      if game.update(japanese_name: japanese_name)
        puts "✅ 成功: #{japanese_name}"
        success_count += 1
      else
        puts "❌ 保存失敗: #{game.errors.full_messages.join(', ')}"
        failure_count += 1
        errors << "#{game.name}: 保存エラー"
      end
    else
      puts "📝 日本語名なし"
      failure_count += 1
    end
    
    # 進捗表示
    if (index + 1) % 10 == 0
      puts "\n--- 進捗 #{index + 1}/#{total_games} (#{((index + 1).to_f / total_games * 100).round(1)}%) ---"
      puts "成功: #{success_count}, 失敗: #{failure_count}"
    end
    
    # API制限を考慮して1秒待機
    sleep(1)
    
  rescue => e
    puts "❌ エラー: #{e.message}"
    failure_count += 1
    errors << "#{game.name}: #{e.message}"
  end
end

puts "\n=== 処理完了 ==="
puts "終了時刻: #{Time.current}"
puts "成功: #{success_count}件"
puts "失敗: #{failure_count}件"
puts "成功率: #{(success_count.to_f / total_games * 100).round(1)}%"

if errors.any?
  puts "\n=== エラー詳細 ==="
  errors.each { |error| puts error }
end

puts "\n=== 最終結果 ==="
puts "日本語名あり: #{Game.where.not(japanese_name: [nil, '']).count}件"
puts "日本語名なし: #{Game.where(japanese_name: [nil, '']).count}件" 