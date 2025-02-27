module Api
  module V1
    class GamesController < ApplicationController
      def index
        @games = Game.all
        @games = @games.joins(:reviews)

        # 総合得点でのフィルタリング
        if params[:total_score_min].present?
          @games = @games.where("games.average_score >= ?", params[:total_score_min])
        end

        if params[:total_score_max].present?
          @games = @games.where("games.average_score <= ?", params[:total_score_max])
        end

        # 相互作用でのフィルタリング
        if params[:interaction_min].present?
          @games = @games.where("reviews.interaction >= ?", params[:interaction_min])
        end

        if params[:interaction_max].present?
          @games = @games.where("reviews.interaction <= ?", params[:interaction_max])
        end

        # 運要素でのフィルタリング
        if params[:luck_factor_min].present?
          @games = @games.where("reviews.luck_factor >= ?", params[:luck_factor_min])
        end

        if params[:luck_factor_max].present?
          @games = @games.where("reviews.luck_factor <= ?", params[:luck_factor_max])
        end

        # おすすめのプレイ人数でのフィルタリング
        if params[:recommended_players].present?
          players = params[:recommended_players].split(',')
          @games = @games.where("reviews.recommended_players && ARRAY[?]::varchar[]", players)
        end

        # 重複を除去
        @games = @games.distinct

        @games = @games.order(created_at: :desc)
        render json: @games
      end

      def show
        Rails.logger.info "Searching for game with BGG ID: #{params[:id]}"
        @game = Game.find_by(bgg_id: params[:id])
        Rails.logger.info "Found local game: #{@game.inspect}"

        if @game
          render json: prepare_game_data(@game)
        else
          render json: { error: 'ゲームが見つかりません' }, status: :not_found
        end
      end

      def create
        # BGG IDからゲーム情報を取得
        bgg_id = params[:bgg_id]
        
        # 既存のゲームをチェック
        existing_game = Game.find_by(bgg_id: bgg_id)
        if existing_game
          render json: prepare_game_data(existing_game), status: :ok
          return
        end
        
        # BGG APIからゲーム情報を取得
        game_details = BggService.get_game_details(bgg_id).first
        
        if game_details
          # ゲームを作成
          @game = Game.new(
            bgg_id: bgg_id,
            name: game_details[:name],
            japanese_name: game_details[:japanese_name],
            description: game_details[:description],
            japanese_description: game_details[:japanese_description],
            image_url: game_details[:image_url],
            min_players: game_details[:min_players],
            max_players: game_details[:max_players],
            play_time: game_details[:play_time],
            average_score: game_details[:average_score]
          )
          
          if @game.save
            # システムユーザーによるレビューを作成（BGGのデータを使用）
            create_system_review(@game, game_details) if game_details[:average_score].present?
            
            # バックグラウンドジョブでゲームの人気機能を更新
            UpdateGamePopularFeaturesJob.perform_later(@game.bgg_id)
            
            render json: prepare_game_data(@game), status: :created
          else
            render json: { error: @game.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        else
          render json: { error: 'BGGからゲーム情報を取得できませんでした' }, status: :not_found
        end
      end

      def search
        Rails.logger.info "Search params: #{params.inspect}"
        
        @games = Game.all

        # キーワード検索
        if params[:keyword].present?
          keyword = "%#{params[:keyword]}%"
          @games = @games.where("name ILIKE ? OR description ILIKE ?", keyword, keyword)
        end

        # プレイ人数での絞り込み
        if params[:min_players].present?
          min_players = params[:min_players].to_i
          @games = @games.where("min_players <= ?", min_players)
        end

        if params[:max_players].present?
          max_players = params[:max_players].to_i
          @games = @games.where("max_players >= ?", max_players)
        end

        # レビューに基づく絞り込み
        if review_filters_present? || total_score_filters_present?
          @games = @games.joins(:reviews)
                         .group('games.id')

          # 総合評価での絞り込み
          if params[:total_score_min].present?
            @games = @games.having("AVG(NULLIF(reviews.overall_score, 0)) >= ?", params[:total_score_min])
          end

          if params[:total_score_max].present?
            @games = @games.having("AVG(NULLIF(reviews.overall_score, 0)) <= ?", params[:total_score_max])
          end

          # 複雑さでの絞り込み
          if params[:complexity_min].present?
            @games = @games.having("AVG(NULLIF(reviews.rule_complexity, 0)) >= ?", params[:complexity_min])
          end
          
          if params[:complexity_max].present?
            @games = @games.having("AVG(NULLIF(reviews.rule_complexity, 0)) <= ?", params[:complexity_max])
          end

          # 運要素での絞り込み
          if params[:luck_factor_min].present?
            @games = @games.having("AVG(NULLIF(reviews.luck_factor, 0)) >= ?", params[:luck_factor_min])
          end
          
          if params[:luck_factor_max].present?
            @games = @games.having("AVG(NULLIF(reviews.luck_factor, 0)) <= ?", params[:luck_factor_max])
          end

          # インタラクションでの絞り込み
          if params[:interaction_min].present?
            @games = @games.having("AVG(NULLIF(reviews.interaction, 0)) >= ?", params[:interaction_min])
          end
          
          if params[:interaction_max].present?
            @games = @games.having("AVG(NULLIF(reviews.interaction, 0)) <= ?", params[:interaction_max])
          end

          # ダウンタイムでの絞り込み
          if params[:downtime_min].present?
            @games = @games.having("AVG(NULLIF(reviews.downtime, 0)) >= ?", params[:downtime_min])
          end
          
          if params[:downtime_max].present?
            @games = @games.having("AVG(NULLIF(reviews.downtime, 0)) <= ?", params[:downtime_max])
          end

          # プレイ時間での絞り込み
          if params[:play_time_min].present?
            @games = @games.having("AVG(NULLIF(reviews.play_time, 0)) >= ?", params[:play_time_min])
          end
          
          if params[:play_time_max].present?
            @games = @games.having("AVG(NULLIF(reviews.play_time, 0)) <= ?", params[:play_time_max])
          end
        end

        # メカニクスでの絞り込み（レビューのメカニクス）
        if params[:mechanics].present? && params[:use_reviews_mechanics] == 'true'
          mechanics = params[:mechanics].split(',')
          @games = @games.joins(:reviews)
                         .where("reviews.mechanics && ARRAY[?]::varchar[]", mechanics)
                         .distinct
        end

        # メカニクスでの絞り込み（人気メカニクス）
        if params[:mechanics].present? && params[:use_reviews_mechanics] != 'true'
          mechanics = params[:mechanics].split(',')
          @games = @games.where("popular_mechanics && ARRAY[?]::varchar[]", mechanics)
        end

        # タグでの絞り込み（レビューのタグ）
        if params[:tags].present? && params[:use_reviews_tags] == 'true'
          tags = params[:tags].split(',')
          @games = @games.joins(:reviews)
                         .where("reviews.tags && ARRAY[?]::varchar[] OR reviews.custom_tags && ARRAY[?]::varchar[]", tags, tags)
                         .distinct
        end

        # タグでの絞り込み（人気タグ）
        if params[:tags].present? && params[:use_reviews_tags] != 'true'
          tags = params[:tags].split(',')
          @games = @games.where("popular_tags && ARRAY[?]::varchar[]", tags)
        end

        # おすすめプレイ人数での絞り込み（レビューのおすすめプレイ人数）
        if params[:recommended_players].present? && params[:use_reviews_recommended_players] == 'true'
          players = params[:recommended_players].split(',')
          @games = @games.joins(:reviews)
                         .where("reviews.recommended_players && ARRAY[?]::varchar[]", players)
                         .distinct
        end

        # おすすめプレイ人数での絞り込み（サイト内おすすめプレイ人数）
        if params[:recommended_players].present? && params[:use_reviews_recommended_players] != 'true'
          players = params[:recommended_players].split(',')
          @games = @games.where("site_recommended_players && ARRAY[?]::varchar[]", players)
        end

        Rails.logger.info "Found #{@games.count} games matching the criteria"
        render json: @games.map { |game| prepare_game_data(game) }
      end

      def popular
        # BGGから人気ゲームを取得
        popular_games = BggService.get_popular_games
        render json: popular_games
      end

      def update_japanese_name
        Rails.logger.info "Updating Japanese name for game with BGG ID: #{params[:id]}"
        @game = Game.find_by(bgg_id: params[:id])
        
        if @game
          old_japanese_name = @game.japanese_name
          if @game.update(japanese_name: params[:japanese_name])
            # 編集履歴を記録
            if current_user
              GameEditHistory.create(
                user: current_user,
                game: @game,
                action: 'update_japanese_name',
                details: {
                  old_value: old_japanese_name,
                  new_value: params[:japanese_name]
                }.to_json
              )
              Rails.logger.info "Recorded edit history for user #{current_user.id} updating Japanese name of game #{@game.id}"
            end
            
            Rails.logger.info "Updated Japanese name for game #{@game.name} to: #{params[:japanese_name]}"
            render json: prepare_game_data(@game)
          else
            Rails.logger.error "Failed to update Japanese name: #{@game.errors.full_messages}"
            render json: { error: @game.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        else
          Rails.logger.error "Game not found with BGG ID: #{params[:id]}"
          render json: { error: 'ゲームが見つかりません' }, status: :not_found
        end
      end

      def edit_histories
        # 管理者権限チェック
        unless current_user && current_user.admin?
          render json: { error: '管理者権限が必要です' }, status: :forbidden
          return
        end

        # ゲームIDが指定されている場合は、そのゲームの編集履歴のみを取得
        if params[:game_id].present?
          @game = Game.find_by(bgg_id: params[:game_id])
          unless @game
            render json: { error: 'ゲームが見つかりません' }, status: :not_found
            return
          end
          @histories = @game.game_edit_histories.includes(:user).order(created_at: :desc)
        else
          # 全ての編集履歴を取得（ページネーション付き）
          page = (params[:page] || 1).to_i
          per_page = 20
          offset = (page - 1) * per_page
          
          @histories = GameEditHistory.includes(:user, :game)
                                     .order(created_at: :desc)
                                     .offset(offset)
                                     .limit(per_page)
          
          total_count = GameEditHistory.count
        end

        # レスポンスを整形
        histories_json = @histories.map do |history|
          {
            id: history.id,
            game_id: history.game.bgg_id,
            game_name: history.game.name,
            user_id: history.user_id,
            user_name: history.user.name,
            user_email: history.user.email,
            action: history.action,
            details: JSON.parse(history.details),
            created_at: history.created_at
          }
        end

        render json: {
          histories: histories_json,
          total_count: params[:game_id].present? ? @histories.count : total_count,
          current_page: params[:page].to_i || 1,
          total_pages: params[:game_id].present? ? 1 : (total_count.to_f / 20).ceil
        }
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
          :average_score,
          :weight,
          best_num_players: [],
          recommended_num_players: []
        )
      end

      def prepare_game_data(game)
        # ゲームデータを整形して返す
        {
          id: game.id,
          bgg_id: game.bgg_id,
          name: game.name,
          japanese_name: game.japanese_name,
          description: game.description,
          japanese_description: game.japanese_description,
          image_url: game.image_url,
          min_players: game.min_players,
          max_players: game.max_players,
          play_time: game.play_time,
          average_score: game.average_score,
          reviews_count: game.reviews.count,
          average_rule_complexity: game.reviews.average(:rule_complexity)&.round(1),
          average_luck_factor: game.reviews.average(:luck_factor)&.round(1),
          average_interaction: game.reviews.average(:interaction)&.round(1),
          average_downtime: game.reviews.average(:downtime)&.round(1),
          popular_tags: game.popular_tags,
          popular_mechanics: game.popular_mechanics,
          site_recommended_players: game.site_recommended_players,
          bgg_url: game.bgg_url
        }
      end

      def create_system_review(game, game_details)
        # システムユーザーを取得
        system_user = User.find_by(email: 'system@boardgamereview.com')
        return unless system_user
        
        # BGGのweightを1-5のスケールに変換（存在する場合のみ）
        normalized_weight = nil
        if game_details[:weight].present?
          bgg_weight = game_details[:weight].to_f
          normalized_weight = ((bgg_weight / 5.0) * 4.0 + 1).round(1)
          Rails.logger.info "Normalized weight: #{normalized_weight}"
        end
        
        # 推奨プレイ人数を設定
        recommended_players = game_details[:recommendedPlayers] || []
        
        # システムユーザーとして10票のレビューを作成
        10.times do |i|
          begin
            review = Review.new(
              user: system_user,
              game: game,
              overall_score: game_details[:average_score].present? ? game_details[:average_score].to_f : nil,
              short_comment: "BoardGameGeekからの初期評価",
              play_time: game.play_time,
              rule_complexity: normalized_weight,
              recommended_players: recommended_players,
              mechanics: [],
              tags: [],
              custom_tags: []
            )
            review.save(validate: false)
            Rails.logger.info "Created BGG review #{i+1}/10 for game #{game.id} with score: #{review.overall_score}, rule_complexity: #{review.rule_complexity}, recommended_players: #{review.recommended_players}"
          rescue => e
            Rails.logger.error "Error creating review #{i+1} for game #{game.id}: #{e.message}"
            Rails.logger.error e.backtrace.join("\n")
          end
        end
      end

      def set_game
        @game = Game.find_by(bgg_id: params[:id])
        
        unless @game
          render json: { error: 'ゲームが見つかりません' }, status: :not_found
        end
      end

      def update_game_average_score
        return unless @game

        # レビューの平均スコアを計算（nilの値は除外）
        average = @game.reviews.where.not(overall_score: nil).average(:overall_score)&.round(1)
        
        # ゲームの平均スコアを更新
        @game.update(average_score: average)
        
        Rails.logger.info "Updated game average score: #{average}"
      end

      def review_filters_present?
        params[:complexity_min].present? || params[:complexity_max].present? ||
        params[:luck_factor_min].present? || params[:luck_factor_max].present? ||
        params[:interaction_min].present? || params[:interaction_max].present? ||
        params[:downtime_min].present? || params[:downtime_max].present? ||
        params[:play_time_min].present? || params[:play_time_max].present?
      end

      def total_score_filters_present?
        params[:total_score_min].present? || params[:total_score_max].present?
      end
    end
  end
end
