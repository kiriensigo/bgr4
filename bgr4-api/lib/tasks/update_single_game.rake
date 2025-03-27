namespace :reviews do
  desc "指定したゲームのシステムレビューを更新する (例: rake reviews:update_game_review[342942])"
  task :update_game_review, [:bgg_id] => :environment do |t, args|
    bgg_id = args[:bgg_id] || "342942" # デフォルトはArk Nova
    
    puts "ゲームID #{bgg_id} のシステムレビューを更新します..."
    
    # ゲームを検索
    game = Game.find_by(bgg_id: bgg_id)
    if game
      puts "ゲーム情報: #{game.name} (BGG ID: #{game.bgg_id})"
      
      # システムユーザーを取得
      system_user = User.find_by(email: 'system@boardgamereview.com')
      if system_user
        puts "システムユーザーを見つけました: #{system_user.email}"
        
        # 既存のシステムレビューを削除
        reviews_count = game.reviews.where(user: system_user).count
        puts "削除対象のレビュー数: #{reviews_count}"
        game.reviews.where(user: system_user).destroy_all
        
        # システムレビューを更新
        result = game.update_system_reviews
        puts "更新結果: #{result}"
        
        # 更新後のレビュー数を確認
        new_reviews_count = game.reviews.where(user: system_user).count
        puts "更新後のレビュー数: #{new_reviews_count}"
      else
        puts "システムユーザーが見つかりません"
      end
    else
      puts "ゲームが見つかりません: BGG ID #{bgg_id}"
    end
  end
end 