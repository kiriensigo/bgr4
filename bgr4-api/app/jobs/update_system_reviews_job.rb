class UpdateSystemReviewsJob < ApplicationJob
  queue_as :default

  def perform(game_ids = nil)
    Rails.logger.info "UpdateSystemReviewsJob: Starting to update system reviews"
    
    # システムユーザーを取得
    system_user = User.find_by(email: 'system@boardgamereview.com')
    
    unless system_user
      Rails.logger.error "UpdateSystemReviewsJob: System user not found"
      return
    end
    
    # 対象のゲームを決定
    games = if game_ids.present?
      # 指定されたゲームIDのみを処理
      Game.where(bgg_id: game_ids)
    else
      # すべてのゲームを処理
      Game.all
    end
    
    total_games = games.count
    Rails.logger.info "UpdateSystemReviewsJob: Processing #{total_games} games"
    
    success_count = 0
    error_count = 0
    
    # 各ゲームのシステムレビューを更新
    games.find_each do |game|
      begin
        Rails.logger.info "UpdateSystemReviewsJob: Updating system reviews for game #{game.name} (#{game.bgg_id})"
        
        # システムレビューを更新
        if game.update_system_reviews
          success_count += 1
          Rails.logger.info "UpdateSystemReviewsJob: Successfully updated system reviews for game #{game.name}"
        else
          error_count += 1
          Rails.logger.error "UpdateSystemReviewsJob: Failed to update system reviews for game #{game.name}"
        end
      rescue => e
        error_count += 1
        Rails.logger.error "UpdateSystemReviewsJob: Error updating system reviews for game #{game.name}: #{e.message}"
      end
    end
    
    Rails.logger.info "UpdateSystemReviewsJob: Completed. Success: #{success_count}, Error: #{error_count}, Total: #{total_games}"
  rescue => e
    Rails.logger.error "UpdateSystemReviewsJob: Error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
  end
end 