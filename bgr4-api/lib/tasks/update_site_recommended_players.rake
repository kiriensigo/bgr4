namespace :games do
  desc "すべてのゲームのsite_recommended_playersを更新する"
  task update_site_recommended_players: :environment do
    puts "すべてのゲームのsite_recommended_playersを更新しています..."
    
    # システムユーザーを取得
    system_user = User.find_by(email: 'system@boardgamereview.com')
    
    # レビューが存在するゲームを取得
    games_with_reviews = Game.joins(:reviews).distinct
    
    puts "レビューが存在するゲーム数: #{games_with_reviews.count}"
    
    # 各ゲームのsite_recommended_playersを更新
    games_with_reviews.find_each do |game|
      # すべてのレビュー（システムユーザーのレビューも含む）
      all_reviews = game.reviews
      total_reviews_count = all_reviews.count
      
      # ユーザーレビュー（システムユーザー以外）
      user_reviews = game.reviews.where.not(user: system_user)
      user_reviews_count = user_reviews.count
      
      puts "ゲーム: #{game.name} (#{game.bgg_id}) - ユーザーレビュー: #{user_reviews_count}, システムレビュー: #{total_reviews_count - user_reviews_count}"
      
      # おすすめプレイ人数が設定されているレビューを取得
      reviews_with_players = all_reviews.where.not(recommended_players: nil)
      
      # レビューがない場合はスキップ
      if reviews_with_players.count == 0
        puts "  おすすめプレイ人数が設定されているレビューがありません"
        next
      end
      
      # 全レビューからおすすめプレイ人数を集計
      all_recommended_players = reviews_with_players.pluck(:recommended_players).flatten
      
      # 7以上を「7」に変換
      normalized_players = all_recommended_players.map do |player|
        player_num = player.to_i
        player_num >= 7 ? "7" : player
      end
      
      player_counts = normalized_players.group_by(&:itself).transform_values(&:count)
      
      # 50%以上選択された人数を抽出
      threshold = total_reviews_count * 0.5
      recommended_players = player_counts
        .select { |_, count| count >= threshold }
        .keys
        .sort_by { |player| player.to_i }
      
      # 更新前のおすすめプレイ人数
      old_recommended_players = game.site_recommended_players || []
      
      # ゲームのおすすめプレイ人数を更新
      game.site_recommended_players = recommended_players
      game.save!
      
      puts "  更新前: #{old_recommended_players.join(', ')}"
      puts "  更新後: #{recommended_players.join(', ')}"
    end
    
    puts "すべてのゲームのsite_recommended_playersの更新が完了しました"
  end
end 