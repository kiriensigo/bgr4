module Api
  module V1
    class GamesController < ApplicationController
      def index
        begin
          games = Game.all.order(average_score: :desc)
          
          games_data = games.map do |game|
            {
              id: game.id,
              bgg_id: game.bgg_id,
              name: game.name,
              japanese_name: game.japanese_name,
              image_url: game.image_url,
              min_players: game.min_players,
              max_players: game.max_players,
              play_time: game.play_time,
              average_score: game.average_score
            }
          end

          render json: games_data
        rescue => e
          Rails.logger.error "Error in GamesController#index: #{e.message}"
          render json: { error: "ゲーム情報の取得に失敗しました" }, status: :internal_server_error
        end
      end

      def create
        begin
          Rails.logger.debug "Creating game with params: #{game_params.inspect}"
          
          # 既存のゲームをBGG IDで検索
          existing_game = Game.find_by(bgg_id: game_params[:bgg_id])
          
          if existing_game
            Rails.logger.debug "Game with BGG ID #{game_params[:bgg_id]} already exists"
            render json: existing_game
            return
          end
          
          # 新しいゲームを作成
          @game = Game.new(game_params)
          @game.japanese_name = AmazonService.search_game_japanese_name(@game.name)
          
          if @game.save
            Rails.logger.debug "Game created successfully: #{@game.inspect}"
            render json: @game, status: :created
          else
            Rails.logger.error "Game creation failed: #{@game.errors.full_messages}"
            render json: { error: @game.errors.full_messages }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error in GamesController#create: #{e.message}"
          render json: { error: "ゲームの作成に失敗しました" }, status: :internal_server_error
        end
      end

      def show
        begin
          # BGG IDでゲームを検索
          local_game = Game.find_by(bgg_id: params[:id])
          Rails.logger.debug "Searching for game with BGG ID: #{params[:id]}"
          Rails.logger.debug "Found local game: #{local_game.inspect}"
          
          if local_game
            # BGGから最新のデータを取得
            bgg_data = BggService.get_game_details(params[:id])
            
            if bgg_data.present?
              game_data = bgg_data.first
              local_game.update(
                name: game_data[:name],
                japanese_name: game_data[:japanese_name],
                description: game_data[:description],
                image_url: game_data[:image_url],
                min_players: game_data[:min_players],
                max_players: game_data[:max_players],
                play_time: game_data[:play_time],
                average_score: game_data[:average_score]
              )
            end

            # レビューを取得
            reviews = Review.where(game_id: params[:id])
            
            render json: {
              id: local_game.id,
              bgg_id: local_game.bgg_id,
              name: local_game.name,
              japanese_name: local_game.japanese_name,
              description: local_game.description,
              image_url: local_game.image_url,
              min_players: local_game.min_players,
              max_players: local_game.max_players,
              play_time: local_game.play_time,
              average_score: local_game.average_score,
              reviews: reviews
            }
          else
            render json: { error: "ゲームが見つかりませんでした" }, status: :not_found
          end
        rescue => e
          Rails.logger.error "Error in GamesController#show: #{e.message}"
          render json: { error: "ゲーム情報の取得に失敗しました" }, status: :internal_server_error
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

      private

      def game_params
        params.require(:game).permit(
          :bgg_id,
          :name,
          :japanese_name,
          :description,
          :image_url,
          :min_players,
          :max_players,
          :play_time,
          :average_score
        )
      end
    end
  end
end
