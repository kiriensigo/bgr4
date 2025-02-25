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
          render json: prepare_game_data(@game)
        else
          render json: { error: 'ゲームが見つかりません' }, status: :not_found
        end
      end

      def create
        Rails.logger.info "Creating game with params: #{params.inspect}"
        game_params = params.require(:game).permit(
          :bgg_id, :name, :description, :image_url,
          :min_players, :max_players, :play_time,
          :average_score, :weight,
          best_num_players: [], recommended_num_players: []
        )

        Rails.logger.info "Game params: #{game_params.inspect}"

        @game = Game.find_by(bgg_id: game_params[:bgg_id])

        if @game.nil?
          begin
            @game = Game.new(game_params)
            @game.save!
            Rails.logger.info "Game saved with ID: #{@game.id}, BGG ID: #{@game.bgg_id}"

            # システムユーザーを取得
            system_user = User.find_by(email: 'system@boardgamereview.com')
            Rails.logger.info "Found system user: #{system_user&.email}"

            if system_user
              # 推奨プレイ人数を設定
              recommended_players = []
              if params[:game][:recommended_num_players].present?
                recommended_players = params[:game][:recommended_num_players].map do |num|
                  if num.end_with?('+')
                    "#{num.chomp('+')}以上"
                  else
                    "#{num}"
                  end
                end
                Rails.logger.info "Added recommended players: #{recommended_players.inspect}"
              end

              # BGGのスコアまたはweightが存在する場合、システムユーザーのレビューを作成
              if params[:game][:average_score].present? || params[:game][:weight].present?
                Rails.logger.info "Creating BGG reviews with score: #{params[:game][:average_score]}, weight: #{params[:game][:weight]}"
                
                # BGGのweightを1-5のスケールに変換（存在する場合のみ）
                normalized_weight = nil
                if params[:game][:weight].present?
                  bgg_weight = params[:game][:weight].to_f
                  normalized_weight = ((bgg_weight / 5.0) * 4.0 + 1).round(1)
                  Rails.logger.info "Normalized weight: #{normalized_weight}"
                end
                
                # システムユーザーとして10票のレビューを作成
                10.times do |i|
                  begin
                    review = Review.new(
                      user: system_user,
                      game: @game,
                      overall_score: params[:game][:average_score].present? ? params[:game][:average_score].to_f : nil,
                      short_comment: "BoardGameGeekからの初期評価",
                      play_time: params[:game][:play_time],
                      rule_complexity: normalized_weight,
                      recommended_players: recommended_players,
                      mechanics: [],
                      tags: [],
                      custom_tags: []
                    )
                    review.save(validate: false)
                    Rails.logger.info "Created BGG review #{i+1}/10 for game #{@game.id} with score: #{review.overall_score}, rule_complexity: #{review.rule_complexity}, recommended_players: #{review.recommended_players}"
                  rescue => e
                    Rails.logger.error "Error creating review #{i+1} for game #{@game.id}: #{e.message}"
                    Rails.logger.error e.backtrace.join("\n")
                    raise e
                  end
                end
              end
            end

            # ゲームの平均スコアを更新
            update_game_average_score
          rescue => e
            Rails.logger.error "Error creating game: #{e.message}"
            Rails.logger.error e.backtrace.join("\n")
            render json: { error: e.message }, status: :unprocessable_entity
            return
          end
        end

        render json: prepare_game_data(@game), status: :created
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
          :average_score,
          :weight,
          best_num_players: [],
          recommended_num_players: []
        )
      end

      def prepare_game_data(game)
        game_data = game.as_json
        system_user = User.find_by(email: 'system@boardgamereview.com')
        
        # システムユーザー以外のレビューを取得
        user_reviews = game.reviews.includes(:user).where.not(user: system_user)
        
        # レビューの総数を取得（システムユーザーのレビューも含める）
        total_reviews = game.reviews.count
        
        # おすすめプレイ人数を計算（システムユーザーのレビューも含める）
        if total_reviews > 0
          all_recommended_players = game.reviews.where.not(recommended_players: nil).pluck(:recommended_players).flatten
          player_counts = all_recommended_players.group_by(&:itself).transform_values(&:count)
          
          # 50%以上選択された人数を抽出
          threshold = total_reviews * 0.5
          game_data['recommended_players'] = player_counts
            .select { |_, count| count >= threshold }
            .keys
            .sort_by { |player| player.to_i }
        else
          game_data['recommended_players'] = []
        end
        
        # 全レビューの平均点を計算（nilの値は除外）
        game_data['average_score'] = game.reviews.where.not(overall_score: nil).average(:overall_score)&.round(1)
        
        # 一般ユーザーのレビュー数のみをカウント
        game_data['reviews_count'] = user_reviews.count

        # 各評価項目の平均値を計算（一般ユーザーのレビューのみ、nilの値は除外）
        averages = user_reviews.pluck(
          Arel.sql('ROUND(CAST(AVG(NULLIF(rule_complexity, 0)) AS numeric), 1)'),
          Arel.sql('ROUND(CAST(AVG(NULLIF(luck_factor, 0)) AS numeric), 1)'),
          Arel.sql('ROUND(CAST(AVG(NULLIF(interaction, 0)) AS numeric), 1)'),
          Arel.sql('ROUND(CAST(AVG(NULLIF(downtime, 0)) AS numeric), 1)')
        ).first

        # 平均値をgame_dataに追加
        game_data['average_rule_complexity'] = averages&.at(0)
        game_data['average_luck_factor'] = averages&.at(1)
        game_data['average_interaction'] = averages&.at(2)
        game_data['average_downtime'] = averages&.at(3)
        
        # レビュー情報を返す（システムユーザーのレビューは除外）
        game_data['reviews'] = user_reviews.map do |review|
          review.as_json(include: { 
            user: { only: [:id, :name] },
            likes: { only: [:id, :user_id] }
          }).merge(
            likes_count: review.likes_count,
            liked_by_current_user: false # デフォルトはfalse、必要に応じて後で更新
          )
        end
        
        Rails.logger.info "Game #{game.name} (BGG ID: #{game.bgg_id})"
        Rails.logger.info "Average score (including system reviews): #{game_data['average_score']}"
        Rails.logger.info "User reviews count: #{game_data['reviews_count']}"
        Rails.logger.info "Average rule complexity: #{game_data['average_rule_complexity']}"
        Rails.logger.info "Average luck factor: #{game_data['average_luck_factor']}"
        Rails.logger.info "Average interaction: #{game_data['average_interaction']}"
        Rails.logger.info "Average downtime: #{game_data['average_downtime']}"
        Rails.logger.info "Recommended players: #{game_data['recommended_players']&.join(', ')}"
        
        game_data
      end

      def update_game_average_score
        return unless @game

        # レビューの平均スコアを計算（nilの値は除外）
        average = @game.reviews.where.not(overall_score: nil).average(:overall_score)&.round(1)
        
        # ゲームの平均スコアを更新
        @game.update(average_score: average)
        
        Rails.logger.info "Updated game average score: #{average}"
      end
    end
  end
end
