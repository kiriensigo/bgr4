class FetchPopularGamesJob < ApplicationJob
  queue_as :default

  def perform(limit = 50)
    Rails.logger.info "FetchPopularGamesJob: Starting to fetch popular games (limit: #{limit})"
    
    # BGGの人気ゲームを取得
    bgg_games = BggService.get_popular_games(limit)
    
    if bgg_games.present?
      Rails.logger.info "FetchPopularGamesJob: Retrieved #{bgg_games.size} games from BGG"
      
      # 各ゲームを処理
      bgg_games.each do |bgg_game|
        # データ取得ジョブを非同期で実行
        FetchBggDataJob.perform_later(bgg_game[:bgg_id])
      end
      
      Rails.logger.info "FetchPopularGamesJob: Scheduled #{bgg_games.size} FetchBggDataJob jobs"
    else
      Rails.logger.error "FetchPopularGamesJob: Failed to retrieve popular games from BGG"
    end
    
    Rails.logger.info "FetchPopularGamesJob: Completed"
  rescue => e
    Rails.logger.error "FetchPopularGamesJob: Error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
  end
end 