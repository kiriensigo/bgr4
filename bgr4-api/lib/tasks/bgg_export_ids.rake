namespace :bgg do
  desc "Export BGG IDs (rank > 1000) to CSV file"
  task export_high_ranked_game_ids: :environment do
    require 'csv'

    output_dir = Rails.root.join('tmp')
    FileUtils.mkdir_p(output_dir)
    output_file = output_dir.join("high_ranked_game_ids_#{Time.current.strftime('%Y%m%d_%H%M%S')}.csv")

    puts "📝 Exporting high-ranked game IDs (>1000) to #{output_file}..."

    games = Game.where('rank > 1000').order(:rank)

    CSV.open(output_file, 'w') do |csv|
      csv << %w[rank bgg_id name]
      games.find_each do |game|
        csv << [game.rank, game.bgg_id, game.name]
      end
    end

    puts "✅ Export completed. #{games.count} records written."
  end
end 