module Api
  module V1
    class UsersController < ApplicationController
      before_action :authenticate_user!, except: [:show, :reviews]
      before_action :set_user, only: [:show, :reviews]

      # GET /api/v1/users/:id
      def show
        render json: {
          id: @user.id,
          name: @user.name,
          bio: @user.bio,
          avatar_url: @user.avatar_url || @user.image
        }
      end

      # GET /api/v1/users/:id/reviews
      def reviews
        @reviews = Review.includes(:game)
                         .where(user_id: @user.id)
                         .where.not(user: User.find_by(email: 'system@boardgamereview.com'))
                         .order(created_at: :desc)

        render json: @reviews.map { |review|
          {
            id: review.id,
            overall_score: review.overall_score.to_f,
            short_comment: review.short_comment,
            created_at: review.created_at,
            likes_count: review.likes.count,
            game: {
              id: review.game.id,
              bgg_id: review.game.bgg_id,
              name: review.game.name,
              japanese_name: review.game.japanese_name,
              image_url: review.game.image_url,
              min_players: review.game.min_players,
              max_players: review.game.max_players,
              play_time: review.game.play_time,
              average_score: review.game.average_score_value
            }
          }
        }
      end

      # GET/PUT /api/v1/users/profile
      def profile
        if request.get?
          # GETリクエストの場合
          render json: {
            id: current_user.id,
            name: current_user.name,
            bio: current_user.bio,
            avatar_url: current_user.avatar_url || current_user.image
          }
        elsif request.put?
          # PUTリクエストの場合
          if current_user.update(profile_params)
            render json: {
              id: current_user.id,
              name: current_user.name,
              bio: current_user.bio,
              avatar_url: current_user.avatar_url || current_user.image
            }
          else
            render json: { error: current_user.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end
      end

      private

      def set_user
        @user = User.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'ユーザーが見つかりません' }, status: :not_found
      end

      def profile_params
        params.permit(:name, :bio)
      end
    end
  end
end 