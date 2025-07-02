namespace :games do
  desc 'BGGメタデータ(categories, mechanics, best/recommended players)が欠落しているゲームを補完'
  task backfill_metadata: :environment do
    scope = Game.where("metadata IS NULL OR metadata::text = '{}'")
    if ENV['LIMIT']
      limit = ENV['LIMIT'].to_i
      puts "⚙️  LIMIT オプション検出: 最大#{limit}件のみ処理"
      games = scope.order(:id).limit(limit)
    else
      games = scope
    end
    puts "🔍 メタデータ未設定ゲーム: #{games.count}件"

    games.find_each(batch_size: 50) do |game|
      begin
        details = BggService.get_game_details(game.bgg_id)
        next unless details

        game.update!(
          categories: details[:categories],
          mechanics: details[:mechanics],
          metadata: {
            categories: details[:categories],
            mechanics: details[:mechanics],
            best_num_players: details[:best_num_players],
            recommended_num_players: details[:recommended_num_players]
          }
        )

        # BGGデータをサイト向けに変換して永続化
        converted_categories = game.get_bgg_converted_categories
        converted_mechanics  = game.get_bgg_converted_mechanics
        game.update!(
          popular_categories: converted_categories,
          popular_mechanics:  converted_mechanics
        )

        game.update_site_recommended_players
        puts "  ✅ #{game.display_name} を更新"

        # BGG API のレートリミット対策
        sleep 1
      rescue => e
        puts "  ❌ #{game.display_name}: #{e.message}"
      end
    end

    puts '🏁 メタデータ補完完了'
  end
end 