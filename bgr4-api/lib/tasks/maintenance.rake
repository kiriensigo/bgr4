namespace :maintenance do
  desc "Find games with missing BGG data (score or weight) and re-fetch from BGG. Run with `rake 'maintenance:fix_incomplete_bgg_games[true]'` to force overwrite existing data."
  task :fix_incomplete_bgg_games, [:force] => :environment do |t, args|
    force_update = args[:force].to_s.downcase == 'true'
    
    puts "Searching for games with incomplete BGG data..."
    if force_update
      puts "Force update mode is ON. Existing data may be overwritten."
    else
      puts "Force update mode is OFF. Only blank fields will be filled."
    end

    # bgg_idがあり、bgg_score (BGGスコア)またはweightがnilのゲームを検索
    incomplete_games = Game.where.not(bgg_id: nil).where('bgg_score IS NULL OR weight IS NULL')
    
    game_count = incomplete_games.count
    puts "Found #{game_count} games to update."

    if game_count.zero?
      puts "No incomplete games found."
    else
      incomplete_games.find_each.with_index do |game, index|
        puts "\nUpdating game #{index + 1}/#{game_count}: ID #{game.id}, BGG ID #{game.bgg_id}"
        begin
          print "  -> Fetching BGG data..."
          # BGGからデータを再取得・更新
          if game.update_from_bgg(force_update)
            print "done.\n"
            print "  -> Recalculating site scores..."
            game.update_average_values
            print "done.\n"
            puts "  -> Successfully updated '#{game.name}'."
          else
            print "failed.\n"
            puts "  -> Could not fetch BGG data (maybe BGG ID is invalid or API is down)."
          end
          # BGG APIへの負荷軽減
          sleep(2)
        rescue => e
          puts "\n  -> FAILED to update game ID #{game.id}: #{e.message}"
        end
      end
      puts "\nFinished updating incomplete games."
    end
  end

  desc "Recalculate all site-specific average scores for all games."
  task recalculate_all_scores: :environment do
    puts "Starting to recalculate average scores for all games..."
    total_games = Game.count
    
    Game.find_each.with_index do |game, index|
      begin
        game.update_average_values
        # 100件ごとに進捗を表示
        if (index + 1) % 100 == 0 || (index + 1) == total_games
          puts "Processed #{index + 1} / #{total_games} games..."
        end
      rescue => e
        puts "\nFailed to update game #{game.id} (#{game.name}): #{e.message}"
      end
    end
    
    puts "Finished recalculating scores for all #{total_games} games."
  end
end 