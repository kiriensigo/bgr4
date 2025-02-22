module Api
  module V1
    class ReviewsController < ApplicationController
      before_action :authenticate_user!, except: [:index, :all]
      before_action :set_game, only: [:index, :create, :update]
      
      def create
        Rails.logger.info "Current user: #{current_user.inspect}"
        Rails.logger.info "Auth headers: #{request.headers.to_h.select { |k, _| k.start_with?('HTTP_') }}"
        
        @review = @game.reviews.build(review_params)
        @review.user = current_user
        
        if @review.save
          # ゲームの平均スコアを更新
          game = @game
          game.update(average_score: game.reviews.average(:overall_score))
          
          render json: @review, status: :created
        else
          render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def index
        @reviews = @game.reviews.includes(:user).order(created_at: :desc)
        render json: @reviews
      end

      def update
        @review = current_user.reviews.find(params[:id])
        
        if @review.update(review_params)
          render json: @review
        else
          render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def all
        @reviews = Review.includes(:user, :game)
                        .order(created_at: :desc)
                        .limit(20)

        reviews_with_game = @reviews.map do |review|
          {
            id: review.id,
            overall_score: review.overall_score,
            play_time: review.play_time,
            rule_complexity: review.rule_complexity,
            luck_factor: review.luck_factor,
            interaction: review.interaction,
            downtime: review.downtime,
            short_comment: review.short_comment,
            recommended_players: review.recommended_players,
            mechanics: review.mechanics,
            tags: review.tags,
            custom_tags: review.custom_tags,
            created_at: review.created_at,
            user: {
              id: review.user.id,
              name: review.user.name,
              image: review.user.image
            },
            game: {
              id: review.game.id,
              bgg_id: review.game.bgg_id,
              name: review.game.name,
              japanese_name: review.game.japanese_name,
              image_url: review.game.image_url,
              min_players: review.game.min_players,
              max_players: review.game.max_players,
              play_time: review.game.play_time,
              average_score: review.game.average_score
            }
          }
        end

        render json: reviews_with_game
      end

      def my
        @reviews = current_user.reviews.includes(:game).order(created_at: :desc)
        render json: @reviews
      end

      private

      def set_game
        @game = Game.find_by!(bgg_id: params[:game_id])
      end

      def review_params
        params.require(:review).permit(
          :overall_score,
          :play_time,
          :rule_complexity,
          :luck_factor,
          :interaction,
          :downtime,
          :short_comment,
          recommended_players: [],
          mechanics: [],
          tags: [],
          custom_tags: []
        )
      end
    end
  end
end 