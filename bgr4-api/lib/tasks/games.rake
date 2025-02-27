namespace :games do
  desc "BGG APIから日本語名を取得して更新する"
  task update_japanese_names: :environment do
    puts "BGG APIから日本語名を取得して更新します..."
    
    # 日本語名が設定されていないゲームを取得
    games_to_update = Game.where(japanese_name: [nil, ""]).or(Game.where("japanese_name LIKE ?", "%:%"))
    total = games_to_update.count
    
    puts "更新対象のゲーム数: #{total}"
    
    # 一度に処理するゲーム数（BGG APIの制限を考慮）
    batch_size = 10
    
    games_to_update.find_each.with_index do |game, index|
      begin
        puts "[#{index + 1}/#{total}] #{game.name} (BGG ID: #{game.bgg_id}) の日本語名を取得中..."
        
        # BGG APIから詳細情報を取得
        game_details = BggService.get_game_details(game.bgg_id).first
        
        if game_details && game_details[:japanese_name].present?
          old_name = game.japanese_name
          game.update(japanese_name: game_details[:japanese_name])
          
          puts "  ✓ 日本語名を更新しました: #{old_name} → #{game.japanese_name}"
        else
          puts "  × 日本語名が見つかりませんでした"
        end
        
        # BGG APIの負荷を軽減するために少し待機
        if (index + 1) % batch_size == 0
          puts "APIの負荷軽減のために5秒待機します..."
          sleep 5
        end
      rescue => e
        puts "  ! エラーが発生しました: #{e.message}"
      end
    end
    
    puts "日本語名の更新が完了しました"
  end
end 