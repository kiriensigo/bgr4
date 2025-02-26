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
        Rails.logger.info "Creating game with params: #{params.inspect}"

        # リクエストの発信元をチェック
        Rails.logger.info "Original referer: #{request.referer}"
        begin
          referer_uri = URI.parse(request.referer.to_s)
          referer_host = referer_uri.host
          referer_port = referer_uri.port
          referer_path = referer_uri.path
          Rails.logger.info "Parsed referer - Host: #{referer_host}, Port: #{referer_port}, Path: #{referer_path}"

          # フロントエンドのオリジンをチェック
          frontend_origin = "localhost:3001"
          is_from_frontend = "#{referer_host}:#{referer_port}" == frontend_origin

          # 許可されたパスをチェック
          allowed_paths = ['/search', '/popular', '/games/register', '/']
          is_allowed_path = allowed_paths.any? { |path| referer_path == path }

          Rails.logger.info "Validation - From Frontend: #{is_from_frontend}, Allowed Path: #{is_allowed_path}, Current Path: #{referer_path}"

          unless is_from_frontend && is_allowed_path
            render json: { error: 'ゲームの登録は検索画面、人気ゲーム画面、またはゲーム登録画面からのみ可能です' }, status: :forbidden
            return
          end
        rescue => e
          Rails.logger.error "Error parsing referer: #{e.message}"
          render json: { error: 'リファラーの検証に失敗しました' }, status: :forbidden
          return
        end

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

        # 複雑さでの絞り込み
        if params[:complexity_min].present? || params[:complexity_max].present?
          @games = @games.joins(:reviews)
                         .group('games.id')
          
          if params[:complexity_min].present?
            @games = @games.having("AVG(reviews.rule_complexity) >= ?", params[:complexity_min])
          end
          
          if params[:complexity_max].present?
            @games = @games.having("AVG(reviews.rule_complexity) <= ?", params[:complexity_max])
          end
        end

        # 運要素での絞り込み
        if params[:luck_factor_min].present? || params[:luck_factor_max].present?
          @games = @games.joins(:reviews)
                         .group('games.id')
          
          if params[:luck_factor_min].present?
            @games = @games.having("AVG(reviews.luck_factor) >= ?", params[:luck_factor_min])
          end
          
          if params[:luck_factor_max].present?
            @games = @games.having("AVG(reviews.luck_factor) <= ?", params[:luck_factor_max])
          end
        end

        # インタラクションでの絞り込み
        if params[:interaction_min].present? || params[:interaction_max].present?
          @games = @games.joins(:reviews)
                         .group('games.id')
          
          if params[:interaction_min].present?
            @games = @games.having("AVG(reviews.interaction) >= ?", params[:interaction_min])
          end
          
          if params[:interaction_max].present?
            @games = @games.having("AVG(reviews.interaction) <= ?", params[:interaction_max])
          end
        end

        # ダウンタイムでの絞り込み
        if params[:downtime_min].present? || params[:downtime_max].present?
          @games = @games.joins(:reviews)
                         .group('games.id')
          
          if params[:downtime_min].present?
            @games = @games.having("AVG(reviews.downtime) >= ?", params[:downtime_min])
          end
          
          if params[:downtime_max].present?
            @games = @games.having("AVG(reviews.downtime) <= ?", params[:downtime_max])
          end
        end

        # プレイ時間での絞り込み
        if params[:play_time_min].present? || params[:play_time_max].present?
          @games = @games.joins(:reviews)
                         .group('games.id')
          
          if params[:play_time_min].present?
            @games = @games.having("AVG(reviews.play_time) >= ?", params[:play_time_min])
          end
          
          if params[:play_time_max].present?
            @games = @games.having("AVG(reviews.play_time) <= ?", params[:play_time_max])
          end
        end

        # メカニクスでの絞り込み
        if params[:mechanics].present?
          mechanics = params[:mechanics].split(',')
          @games = @games.joins(:reviews)
                         .where("reviews.mechanics && ARRAY[?]::varchar[]", mechanics)
                         .distinct
        end

        # タグでの絞り込み
        if params[:tags].present?
          tags = params[:tags].split(',')
          @games = @games.joins(:reviews)
                         .where("reviews.tags && ARRAY[?]::varchar[]", tags)
                         .distinct
        end

        Rails.logger.info "Found #{@games.count} games matching the criteria"
        render json: @games.map { |game| prepare_game_data(game) }
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
