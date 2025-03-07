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
        @reviews = @game.reviews.exclude_system_user.includes(:user)
        
        # ユーザー情報を含めて返す
        render json: @reviews.map { |review|
          review_json = review.as_json
          review_json['user'] = {
            id: review.user.id,
            name: review.user.name,
            image: review.user.image
          }
          review_json
        }
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
        per_page = (params[:per_page] || 12).to_i
        page = (params[:page] || 1).to_i
        
        @reviews = Review.exclude_system_user.includes(:user, :game)
                        .order(created_at: :desc)
                        .offset((page - 1) * per_page)
                        .limit(per_page)

        # ゲームごとのレビュー数を取得
        game_ids = @reviews.map { |review| review.game_id }.uniq
        reviews_count_by_game = Review.exclude_system_user
                                     .where(game_id: game_ids)
                                     .group(:game_id)
                                     .count

        # ユーザー情報を含めて返す
        render json: @reviews.map { |review|
          review_json = review.as_json
          review_json['user'] = {
            id: review.user.id,
            name: review.user.name,
            image: review.user.image
          }
          review_json['game'] = {
            id: review.game.id,
            bgg_id: review.game.bgg_id,
            name: review.game.name,
            japanese_name: review.game.japanese_name,
            image_url: review.game.image_url,
            min_players: review.game.min_players,
            max_players: review.game.max_players,
            play_time: review.game.play_time,
            average_score: review.game.average_score,
            reviews_count: reviews_count_by_game[review.game_id] || 0
          }
          review_json
        }
      end

      def my
        begin
          unless current_user
            Rails.logger.error "Current user is not set"
            return render json: { error: "ユーザーが見つかりません" }, status: :unauthorized
          end

          Rails.logger.info "Fetching reviews for user: #{current_user.id}"
          @reviews = current_user.reviews
                                .includes(:game, :likes)
                                .order(created_at: :desc)

          if @reviews.nil?
            Rails.logger.error "Reviews is nil for user: #{current_user.id}"
            return render json: { reviews: [] }, status: :ok
          end

          # 明示的にルートキーを指定してJSONを返す
          render json: { reviews: @reviews.map { |review| review_with_details(review) } }
        rescue => e
          Rails.logger.error "Error in my action: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: "レビューの取得中にエラーが発生しました: #{e.message}" }, status: :internal_server_error
        end
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
          :rule_complexity,
          :luck_factor,
          :interaction,
          :downtime,
          :short_comment,
          recommended_players: [],
          mechanics: [],
          categories: [],
          custom_tags: []
        )
      end

      def review_with_details(review)
        # ゲームのレビュー数を取得
        reviews_count = Review.where(game_id: review.game_id).count

        {
          id: review.id,
          overall_score: review.overall_score,
          rule_complexity: review.rule_complexity,
          luck_factor: review.luck_factor,
          interaction: review.interaction,
          downtime: review.downtime,
          short_comment: review.short_comment,
          recommended_players: review.recommended_players,
          mechanics: review.mechanics,
          categories: review.categories,
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
            average_score: review.game.average_score,
            reviews_count: reviews_count
          }
        }
      end
    end
  end
end 