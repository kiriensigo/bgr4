namespace :games do
  desc 'average_score カラムの値を bgg_score に移行し、平均値を再計算する'
  task backfill_bgg_score: :environment do
    games = Game.where(bgg_score: [nil, 0]).where.not(average_score: nil)
    puts "🔄 bgg_score を補完するゲーム: #{games.count}件"

    games.find_each(batch_size: 100) do |game|
      game.update_columns(bgg_score: game.average_score)
      game.update_average_values
    end

    puts '🏁 backfill_bgg_score 完了'
  end
end 