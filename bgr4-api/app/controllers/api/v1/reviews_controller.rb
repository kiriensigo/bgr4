module Api
  module V1
    class ReviewsController < ApplicationController
      before_action :authenticate_user!, only: [:create]
      
      def create
        review = current_user.reviews.build(review_params)
        
        if review.save
          # ゲームの平均スコアを更新
          game = review.game
          game.update(average_score: game.reviews.average(:overall_score))
          
          render json: review, status: :created
        else
          render json: { error: review.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def index
        reviews = Review.where(game_id: params[:game_id])
                       .includes(:user)
                       .order(created_at: :desc)
        
        render json: reviews, include: :user
      end

      private

      def review_params
        params.require(:review).permit(
          :game_id,
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