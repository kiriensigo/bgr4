namespace :debug do
  desc "Find a game with null average_score_value and print its details"
  task :find_null_score_game => :environment do
    puts "Searching for a game with a null score..."
    
    # average_score_valueがNULLのゲームを1つ探す
    game_with_null_score = Game.find_by(average_score_value: nil)
    
    if game_with_null_score.nil?
      puts "No games with null average_score_value found. All scores seem to be calculated."
    else
      puts "Found a game with null score: '#{game_with_null_score.name}' (ID: #{game_with_null_score.id}, BGG_ID: #{game_with_null_score.bgg_id})"
      puts "--------------------------------------------------"
      puts "Game Attributes:"
      puts "  - BGG Score (bgg_score): #{game_with_null_score.bgg_score.inspect}"
      puts "  - Weight: #{game_with_null_score.weight.inspect}"
      puts "  - is_bgg_game?: #{!game_with_null_score.bgg_id.start_with?('manual-')}"
      
      puts "\nReview Details:"
      user_reviews = game_with_null_score.reviews.exclude_system_user
      review_count = user_reviews.count
      puts "  - User Review Count: #{review_count}"

      if review_count > 0
        puts "  - User Reviews:"
        user_reviews.each_with_index do |review, i|
          puts "    - Review ##{i+1} (ID: #{review.id})"
          puts "      - overall_score: #{review.overall_score.inspect}"
          puts "      - rule_complexity: #{review.rule_complexity.inspect}"
          puts "      - interaction: #{review.interaction.inspect}"
          puts "      - downtime: #{review.downtime.inspect}"
          puts "      - luck_factor: #{review.luck_factor.inspect}"
        end

        puts "\n  - Calculated Sums:"
        puts "    - Sum Overall Score: #{user_reviews.sum(:overall_score)}"
        puts "    - Sum Rule Complexity: #{user_reviews.sum(:rule_complexity)}"
      else
        puts "  - No user reviews for this game."
      end
      
      puts "\nRecalculating scores step-by-step for this game:"
      
      # Forcing recalculation to see the values
      game = game_with_null_score
      
      sum_overall_score = user_reviews.sum(:overall_score)
      base_overall_score = !game.bgg_id.start_with?('manual-') ? (game.bgg_score.presence || 7.5) : 7.5
      
      puts "  - Base Overall Score: #{base_overall_score.inspect}"
      
      if review_count > 0
        numerator = sum_overall_score + base_overall_score * 10
        denominator = review_count + 10
        new_avg_score = numerator / denominator
        puts "  - Calculation (reviews > 0): (#{sum_overall_score} + #{base_overall_score} * 10) / (#{review_count} + 10) = #{new_avg_score}"
      else
        new_avg_score = base_overall_score
        puts "  - Calculation (reviews = 0): base_overall_score = #{new_avg_score}"
      end
      
      puts "  - Final Calculated Average Score: #{new_avg_score.inspect}"
      
    end
  end
end 