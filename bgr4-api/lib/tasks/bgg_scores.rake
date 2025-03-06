namespace :bgg do
  desc 'Re-register BGG scores for all games'
  task register_scores: :environment do
    system_user = User.find_by!(email: 'system@boardgamereview.com')
    
    Game.find_each do |game|
      puts "Processing game: #{game.name} (BGG ID: #{game.bgg_id})"
      
      # BGGからスコアを取得
      bgg_details = BggService.get_game_details(game.bgg_id).first
      
      if bgg_details && bgg_details[:average_score].present? && bgg_details[:average_score] > 0
        # 既存のシステムユーザーのレビューを削除
        game.reviews.where(user: system_user).destroy_all
        
        # BGGのスコアを10票として登録
        10.times do
          review = game.reviews.create!(
            user: system_user,
            overall_score: bgg_details[:average_score],
            short_comment: "BoardGameGeekの評価: #{bgg_details[:average_score]}点",
            play_time: game.play_time || 60,
            rule_complexity: 3,
            luck_factor: 3,
            interaction: 3,
            downtime: 3,
            recommended_players: [],
            mechanics: [],
            categories: [],
            custom_tags: []
          )
        end
        
        puts "Created 10 BGG reviews with score #{bgg_details[:average_score]} for #{game.name}"
        puts "Total reviews: #{game.reviews.count}"
      else
        puts "Skipping #{game.name} as it has no BGG score"
      end
    end
    
    puts "Completed re-registering BGG scores"
  end
end 