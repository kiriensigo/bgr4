module Api
  module V1
    class GamesController < ApplicationController
      def index
        @games = Game.all.order(created_at: :desc)
        render json: @games
      end

      def show
        Rails.logger.info "Searching for game with BGG ID: #{params[:id]}"
        @game = Game.find_by(bgg_id: params[:id])
        Rails.logger.info "Found local game: #{@game.inspect}"

        if @game
          render json: @game
        else
          render json: { error: 'ゲームが見つかりません' }, status: :not_found
        end
      end

      def create
        Rails.logger.info "Creating game with params: #{game_params.inspect}"
        
        begin
          @game = Game.find_by(bgg_id: game_params[:bgg_id])
          
          if @game
            Rails.logger.info "Game already exists: #{@game.inspect}"
            render json: @game
            return
          end

          japanese_name = AmazonService.search_game_japanese_name(game_params[:name])
          
          @game = Game.new(game_params)
          @game.japanese_name = japanese_name if japanese_name.present?
          
          if @game.save
            render json: @game, status: :created
          else
            Rails.logger.error "Game creation failed: #{@game.errors.full_messages}"
            render json: { error: @game.errors.full_messages }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error in GamesController#create: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: 'ゲームの作成中にエラーが発生しました' }, status: :internal_server_error
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
