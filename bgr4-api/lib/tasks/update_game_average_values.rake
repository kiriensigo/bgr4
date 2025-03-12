namespace :games do
  desc "Update average values for all games"
  task update_average_values: :environment do
    puts "Updating average values for all games..."
    
    # 全ゲームの平均値を更新
    Game.find_each do |game|
      puts "Updating average values for game: #{game.name} (#{game.bgg_id})"
      game.update_average_values
    end
    
    puts "Finished updating average values for all games."
  end
end 