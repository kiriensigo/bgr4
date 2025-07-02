namespace :games do
  desc 'average_score_valueなどがnilのゲームを一括補完する'
  task backfill_average_values: :environment do
    games = Game.where(average_score_value: nil)
    total = games.count
    puts "🛠️ 平均値が未設定のゲーム: #{total}件"

    processed = 0
    games.find_each(batch_size: 100) do |game|
      begin
        game.update_average_values
        processed += 1
        puts "  ✅ #{game.display_name} を更新 (#{processed}/#{total})" if processed % 50 == 0
      rescue => e
        puts "  ❌ #{game.display_name} の更新失敗: #{e.message}"
      end
    end

    puts "🏁 補完完了: #{processed}件更新"
  end
end 