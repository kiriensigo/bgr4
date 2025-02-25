module Api
  module V1
    class ReviewsController < ApplicationController
      before_action :authenticate_user!, except: [:index, :all]
      before_action :set_game, only: [:index, :create, :update]
      before_action :set_review, only: [:like, :unlike]
      
      def create
        Rails.logger.info "Creating review with params: #{review_params.inspect}"
        Rails.logger.info "Current user: #{current_user.inspect}"
        Rails.logger.info "Game: #{@game.inspect}"
        
        begin
          # 既存のレビューを探す
          @review = Review.find_by(user: current_user, game_id: @game.bgg_id)
          
          if @review
            # 既存のレビューを更新
            Rails.logger.info "Updating existing review: #{@review.inspect}"
            if @review.update(review_params)
              render json: review_with_details(@review), status: :ok
            else
              Rails.logger.error "Review update failed: #{@review.errors.full_messages}"
              render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
            end
          else
            # 新しいレビューを作成
            Rails.logger.info "Creating new review"
            @review = @game.reviews.build(review_params)
            @review.user = current_user
            
            if @review.save
              # ゲームの平均スコアを更新
              @game.update(average_score: @game.reviews.average(:overall_score))
              render json: review_with_details(@review), status: :created
            else
              Rails.logger.error "Review creation failed: #{@review.errors.full_messages}"
              render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
            end
          end
        rescue => e
          Rails.logger.error "Error in create action: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: "レビューの作成中にエラーが発生しました: #{e.message}" }, status: :internal_server_error
        end
      end

      def index
        system_user = User.find_by(email: 'system@boardgamereview.com')
        @reviews = @game.reviews.includes(:user).where.not(user: system_user)
        render json: @reviews.as_json(include: { user: { only: [:id, :name] } })
      end

      def update
        @review = current_user.reviews.find(params[:id])
        
        if @review.update(review_params)
          render json: review_with_details(@review)
        else
          render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def all
        system_user = User.find_by(email: 'system@boardgamereview.com')
        @reviews = Review.includes(:user, :game).where.not(user: system_user).order(created_at: :desc)
        render json: @reviews.as_json(include: { 
          user: { only: [:id, :name] },
          game: { only: [:bgg_id, :name, :image_url] }
        })
      end

      def my
        @reviews = current_user.reviews
                              .includes(:game, :likes)
                              .order(created_at: :desc)
        render json: @reviews.map { |review| review_with_details(review) }
      end

      def like
        if @review.liked_by?(current_user)
          render json: { error: '既にいいねしています' }, status: :unprocessable_entity
        else
          @review.likes.create!(user: current_user)
          render json: review_with_details(@review)
        end
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def unlike
        like = @review.likes.find_by(user: current_user)
        if like
          like.destroy
          render json: review_with_details(@review)
        else
          render json: { error: 'いいねが見つかりません' }, status: :not_found
        end
      end

      private

      def set_game
        @game = Game.find_by!(bgg_id: params[:game_id])
      rescue ActiveRecord::RecordNotFound => e
        Rails.logger.error "Game not found with bgg_id: #{params[:game_id]}"
        render json: { error: 'ゲームが見つかりません' }, status: :not_found
      end

      def set_review
        @review = Review.find(params[:id])
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

      def review_with_details(review)
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
          likes_count: review.likes_count,
          liked_by_current_user: current_user ? review.liked_by?(current_user) : false,
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
    end
  end
end 