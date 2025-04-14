class FetchBggDataJob < ApplicationJob
  queue_as :default

  def perform(bgg_id, force_update = false)
    Rails.logger.info "FetchBggDataJob: Starting to fetch BGG data for ID #{bgg_id}"
    
    # 既存のゲームを検索
    game = Game.find_by(bgg_id: bgg_id)
    
    if game
      Rails.logger.info "FetchBggDataJob: Found existing game: #{game.name}"
      
      # 強制更新フラグがある場合のみ更新
      if force_update
        Rails.logger.info "FetchBggDataJob: Force updating game data"
        game.update_from_bgg(true)
      else
        Rails.logger.info "FetchBggDataJob: Skipping update (force_update not set)"
      end
    else
      Rails.logger.info "FetchBggDataJob: Game not found, creating new game"
      
      # BGGからゲーム情報を取得
      bgg_data = BggService.get_game_details(bgg_id)
      
      if bgg_data
        # ゲームを作成
        game = Game.new(
          bgg_id: bgg_id,
          name: bgg_data[:name],
          japanese_name: bgg_data[:japanese_name],
          description: bgg_data[:description],
          image_url: bgg_data[:image_url],
          min_players: bgg_data[:min_players],
          max_players: bgg_data[:max_players],
          play_time: bgg_data[:play_time],
          min_play_time: bgg_data[:min_play_time],
          weight: bgg_data[:weight],
          publisher: bgg_data[:publisher],
          designer: bgg_data[:designer],
          release_date: bgg_data[:release_date],
          japanese_publisher: bgg_data[:japanese_publisher],
          japanese_release_date: bgg_data[:japanese_release_date],
          registered_on_site: true
        )
        
        # カテゴリとメカニクスを設定
        if bgg_data[:categories].present?
          game.categories = bgg_data[:categories]
        end
        
        if bgg_data[:mechanics].present?
          game.mechanics = bgg_data[:mechanics]
        end
        
        # 拡張情報を設定
        if bgg_data[:expansions].present?
          game.store_metadata('expansions', bgg_data[:expansions])
        end
        
        # ベースゲーム情報を設定
        if bgg_data[:baseGame].present?
          game.store_metadata('base_game', bgg_data[:baseGame])
        end
        
        # ゲームを保存
        if game.save
          Rails.logger.info "FetchBggDataJob: Successfully created game: #{game.name}"
          
          # システムレビューを作成
          if game.create_initial_reviews
            Rails.logger.info "FetchBggDataJob: Created initial system reviews"
          else
            Rails.logger.error "FetchBggDataJob: Failed to create initial system reviews"
          end
        else
          Rails.logger.error "FetchBggDataJob: Failed to save game: #{game.errors.full_messages.join(', ')}"
        end
      else
        Rails.logger.error "FetchBggDataJob: Failed to fetch BGG data for ID #{bgg_id}"
      end
    end
    
    Rails.logger.info "FetchBggDataJob: Completed for BGG ID #{bgg_id}"
  rescue => e
    Rails.logger.error "FetchBggDataJob: Error processing BGG ID #{bgg_id}: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
  end
end 