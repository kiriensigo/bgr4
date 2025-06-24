# frozen_string_literal: true

module Api
  module V1
    module Resources
      class GamesController < BaseController
        before_action :authenticate_user_with_response!, 
                      except: [:index, :show, :basic, :statistics, :reviews, :related]
        before_action :ensure_admin!, only: [:update_system_reviews]
        before_action :set_game, only: [:show, :basic, :statistics, :reviews, :related, 
                                       :update, :destroy, :update_from_bgg, :update_system_reviews]

        # GET /api/v1/games
        def index
          begin
            pagination = pagination_params
            sort_by = params[:sort_by] || 'name_asc'
            
            # ベースクエリ（登録済みゲームのみ）
            base_query = Game.where(registered_on_site: true)
            
            # ソート処理
            sorted_query = apply_sorting(base_query, sort_by)
            
            # ページネーション適用
            result = paginate(sorted_query)
            
            # ゲームデータをシリアライザーで整形
            games_data = result[:items].map do |game|
              GameSerializer.new(game, scope: current_user).as_json
            end
            
            paginated_response(
              games_data,
              result[:total_count],
              result[:page],
              result[:per_page]
            )
          rescue => e
            handle_standard_error(e)
          end
        end

        # GET /api/v1/games/:id
        def show
          begin
            game_data = GameSerializer.new(@game, scope: current_user).as_json
            
            # 日本語名の正規化
            if game_data['japanese_name'] && !game_data['japanese_name'].match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
              game_data['japanese_name'] = nil
            end
            
            # レビュー情報を含める
            game_data['reviews'] = @game.reviews.exclude_system_user.includes(:user).map do |review|
              review_json = review.as_json
              review_json['user'] = {
                id: review.user.id,
                name: review.user.name,
                image: review.user.image
              }
              review_json
            end
            
            # 統計情報を追加
            game_data.merge!(
              popular_categories: @game.popular_categories,
              popular_mechanics: @game.popular_mechanics,
              recommended_players: @game.recommended_players,
              site_recommended_players: @game.site_recommended_players,
              review_count: @game.user_reviews_count,
              average_rule_complexity: @game.average_rule_complexity_value,
              average_luck_factor: @game.average_luck_factor_value,
              average_interaction: @game.average_interaction_value,
              average_downtime: @game.average_downtime_value,
              average_overall_score: @game.average_score_value
            )
            
            success_response(game_data)
          rescue => e
            handle_standard_error(e)
          end
        end

        # GET /api/v1/games/:id/basic (高速レスポンス用)
        def basic
          begin
            basic_fields = [
              :id, :bgg_id, :name, :japanese_name, :description, :japanese_description,
              :image_url, :japanese_image_url, :thumbnail, :min_players, :max_players,
              :play_time, :min_play_time, :publisher, :japanese_publisher, :designer,
              :release_date, :japanese_release_date, :weight, :created_at, :updated_at
            ]
            
            game_data = @game.as_json(only: basic_fields)
            
            # 日本語名の正規化
            if game_data['japanese_name'] && !game_data['japanese_name'].match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
              game_data['japanese_name'] = nil
            end
            
            # ウィッシュリスト情報を追加（ユーザーがログインしている場合）
            if current_user
              wishlist_item = current_user.wishlist_items.find_by(game: @game)
              game_data['in_wishlist'] = wishlist_item.present?
              game_data['wishlist_item_id'] = wishlist_item&.id
            end
            
            success_response(game_data)
          rescue => e
            handle_standard_error(e)
          end
        end

        # GET /api/v1/games/:id/statistics
        def statistics
          begin
            stats = {
              average_rule_complexity: @game.average_rule_complexity_value,
              average_luck_factor: @game.average_luck_factor_value,
              average_interaction: @game.average_interaction_value,
              average_downtime: @game.average_downtime_value,
              average_overall_score: @game.average_score_value,
              reviews_count: @game.user_reviews_count,
              popular_categories: @game.popular_categories,
              popular_mechanics: @game.popular_mechanics,
              recommended_players: @game.recommended_players,
              site_recommended_players: @game.site_recommended_players
            }
            
            success_response(stats)
          rescue => e
            handle_standard_error(e)
          end
        end

        # POST /api/v1/games
        def create
          begin
            # 権限チェック
            return unless ensure_sufficient_reviews!
            
            game_params = params[:game]
            manual_registration = params[:manual_registration] == 'true' || params[:manual_registration] == true
            
            if manual_registration
              create_manual_game
            else
              create_from_bgg
            end
          rescue => e
            handle_standard_error(e)
          end
        end

        private

        def set_game
          @game = Game.find_by(bgg_id: params[:id])
          not_found_response("ゲーム") unless @game
        end

        def apply_sorting(query, sort_by)
          case sort_by
          when 'reviews_count'
            query.order('user_reviews_count DESC, games.id ASC')
          when 'average_score'
            query.order('average_score_value DESC NULLS LAST, games.id ASC')
          when 'review_date'
            system_user_id = User.find_by(email: 'system@boardgamereview.com')&.id
            query.left_joins(:reviews)
                 .where("reviews.user_id != ? OR reviews.id IS NULL", system_user_id)
                 .group('games.id')
                 .order('MAX(reviews.created_at) DESC NULLS LAST, games.created_at DESC, games.id ASC')
          when 'name_asc'
            query.order(name: :asc, id: :asc)
          when 'name_desc'
            query.order(name: :desc, id: :asc)
          when 'release_date_desc'
            query.order(release_date: :desc, id: :asc)
          when 'release_date_asc'
            query.order(release_date: :asc, id: :asc)
          else
            query.order(created_at: :desc, id: :asc)
          end
        end

        def create_from_bgg
          return error_response("BGG IDが必要です") if params[:game][:bgg_id].blank?
          
          bgg_id = params[:game][:bgg_id]
          existing_game = Game.find_by(bgg_id: bgg_id)
          
          if existing_game
            if existing_game.registered_on_site?
              return error_response("このゲームは既に登録されています")
            else
              existing_game.update!(registered_on_site: true)
              return success_response(existing_game, "ゲームを有効化しました", :ok)
            end
          end
          
          # BGGからゲーム情報を取得
          begin
            bgg_game_info = BggService.get_game_details(bgg_id)
            return handle_bgg_api_error("ゲーム情報を取得できませんでした") unless bgg_game_info
            
            game = Game.create!(bgg_game_info.merge(registered_on_site: true))
            success_response(game, "ゲームを登録しました", :created)
          rescue => e
            Rails.logger.error "Game creation failed: #{e.message}"
            error_response("ゲームの作成中にエラーが発生しました", :unprocessable_entity)
          end
        end

        def create_manual_game
          # 手動登録の実装（既存ロジックから移植）
          error_response("手動登録は未実装です", :not_implemented)
        end
      end
    end
  end
end 