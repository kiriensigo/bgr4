namespace :games do
  desc "Update average values for all games"
  task update_averages: :environment do
    puts "Updating average values for all games..."
    
    Game.find_each do |game|
      game.update_average_values
      puts "Updated #{game.name}: score=#{game.average_score_value}, complexity=#{game.average_rule_complexity_value}"
    end
    
    puts "Finished updating average values."
  end
end 