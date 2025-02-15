module Api
  module V1
    class GamesController < ApplicationController
      def index
        # BGGの評価が7.0以上で、評価数が1000以上のゲームを取得
        games = Game.where('average_score >= ?', 7.0)
                   .order(average_score: :desc)
                   .limit(50)
        
        games_data = games.map do |game|
          {
            id: game.id,
            bgg_id: game.bgg_id,
            name: game.name,
            image_url: game.image_url,
            min_players: game.min_players,
            max_players: game.max_players,
            play_time: game.play_time,
            average_score: game.average_score
          }
        end

        render json: games_data
      end

      def show
        begin
          # BGG IDでゲームを検索
          local_game = Game.find_by(bgg_id: params[:id])
          Rails.logger.debug "Searching for game with BGG ID: #{params[:id]}"
          Rails.logger.debug "Found local game: #{local_game.inspect}"
          
          unless local_game
            # ゲームが存在しない場合、BGGから情報を取得して保存
            Rails.logger.debug "Game not found locally, fetching from BGG"
            bgg_game = BggService.get_game_details(params[:id]).first
            
            if bgg_game
              Rails.logger.debug "BGG game details: #{bgg_game.inspect}"
              local_game = Game.create!(
                bgg_id: params[:id],
                name: bgg_game[:name],
                description: bgg_game[:description],
                image_url: bgg_game[:image_url],
                min_players: bgg_game[:min_players],
                max_players: bgg_game[:max_players],
                play_time: bgg_game[:play_time],
                average_score: bgg_game[:average_score]
              )
            else
              Rails.logger.error "BGG game not found with id: #{params[:id]}"
              return render json: { error: 'ゲームが見つかりませんでした' }, status: :not_found
            end
          end

          # BGGから最新の情報を取得
          bgg_game = BggService.get_game_details(local_game.bgg_id).first
          
          if bgg_game.nil?
            Rails.logger.error "Failed to fetch BGG details for game: #{local_game.bgg_id}"
            return render json: { error: 'BGGからの情報取得に失敗しました' }, status: :service_unavailable
          end

          # BGGの情報とローカルの情報をマージ
          game_data = {
            id: local_game.id,
            bgg_id: local_game.bgg_id,
            name: bgg_game[:name],
            description: bgg_game[:description],
            image_url: bgg_game[:image_url],
            min_players: bgg_game[:min_players],
            max_players: bgg_game[:max_players],
            play_time: bgg_game[:play_time],
            bgg_average_score: bgg_game[:average_score].to_f,
            local_average_score: local_game.average_score&.to_f,
            reviews: local_game.reviews.includes(:user)
          }

          render json: game_data
        rescue StandardError => e
          Rails.logger.error "Error in GamesController#show: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: '予期せぬエラーが発生しました', details: e.message }, status: :internal_server_error
        end
      end

      def search
        if params[:query].present?
          games = BggService.search_games(params[:query])
          render json: games
        else
          render json: { error: '検索クエリを入力してください' }, status: :unprocessable_entity
        end
      end

      def popular
        # BGGから人気ゲームを取得
        popular_games = BggService.get_popular_games
        render json: popular_games
      end
    end
  end
end
