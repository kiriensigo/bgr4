module Api
  module V1
    class ReviewsController < ApplicationController
      before_action :authenticate_user!, except: [:index, :all]
      before_action :set_game, except: [:all]
      
      def create
        review = @game.reviews.build(review_params)
        review.user = current_user
        
        if review.save
          # ゲームの平均スコアを更新
          game = @game
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

      def update
        review = @game.reviews.find_by!(user: current_user)
        
        if review.update(review_params)
          render json: review, status: :ok
        else
          render json: { error: review.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def all
        reviews = Review.includes(:user, :game)
                       .order(created_at: :desc)
                       .limit(50)
        
        render json: reviews, include: { 
          user: { only: [:name] },
          game: { 
            only: [:name, :image_url, :id],
            methods: [:bgg_id]
          }
        }, status: :ok
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
          :short_comment
        )
      end
    end
  end
end 