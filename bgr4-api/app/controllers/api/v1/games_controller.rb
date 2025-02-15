module Api
  module V1
    class GamesController < ApplicationController
      def index
        games = Game.all
        Rails.logger.debug "Games found: #{games.inspect}"
        render json: games
      end

      def show
        begin
          game = Game.find(params[:id])
          Rails.logger.debug "Game found: #{game.inspect}"
          render json: game, include: :reviews
        rescue ActiveRecord::RecordNotFound => e
          Rails.logger.error "Game not found with id: #{params[:id]}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: 'ゲームが見つかりませんでした' }, status: :not_found
        rescue StandardError => e
          Rails.logger.error "Unexpected error: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: '予期せぬエラーが発生しました' }, status: :internal_server_error
        end
      end
    end
  end
end
