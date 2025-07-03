module Api
  module V1
    class AdminController < ApplicationController
      before_action :authenticate_user!
      before_action :authenticate_admin!

      # BGG上位1000位のゲーム登録を開始するエンドポイント
      def register_bgg_top_1000
        Rails.logger.info "BGG上位1000位のゲーム登録リクエストを受信 (ユーザー: #{current_user.email})"
        
        begin
          # バックグラウンドジョブとして実行
          RegisterBggTop1000Job.perform_later
          
          render json: { 
            message: "BGG上位1000位のゲーム登録を開始しました。処理はバックグラウンドで実行されます。",
            status: "started"
          }, status: :accepted
          
        rescue => e
          Rails.logger.error "BGG上位1000位のゲーム登録開始エラー: #{e.message}\n#{e.backtrace.join("\n")}"
          render json: { 
            error: "ゲーム登録の開始に失敗しました: #{e.message}" 
          }, status: :internal_server_error
        end
      end

      # BGG上位1000位のゲーム登録の進行状況を取得するエンドポイント
      def bgg_registration_status
        begin
          # レディスやジョブキューから進行状況を取得（実装は環境に依存）
          # ここでは簡易的にログファイルから情報を取得
          
          # 最近登録されたゲーム数を取得
          recent_games_count = Game.where("created_at > ?", 1.hour.ago).count
          
          # システムユーザーのレビュー数を取得（システムレビューの進行状況の目安）
          system_user = User.find_by(email: 'system@boardgamereview.com')
          system_reviews_count = system_user ? system_user.reviews.where("created_at > ?", 1.hour.ago).count : 0
          
          # 全ゲーム数
          total_games = Game.count
          
          render json: {
            status: "processing",
            recent_games_registered: recent_games_count,
            recent_system_reviews_created: system_reviews_count,
            total_games_in_database: total_games,
            last_updated: Time.current
          }
          
        rescue => e
          Rails.logger.error "BGG登録状況取得エラー: #{e.message}"
          render json: { 
            error: "登録状況の取得に失敗しました: #{e.message}" 
          }, status: :internal_server_error
        end
      end

      # システムレビューの統計情報を取得するエンドポイント
      def system_reviews_stats
        begin
          system_user = User.find_by(email: 'system@boardgamereview.com')
          
          if system_user
            # システムレビューの統計
            total_system_reviews = system_user.reviews.count
            games_with_system_reviews = Game.joins(:reviews).where(reviews: { user: system_user }).distinct.count
            
            # システムレビューが10件未満のゲーム
            games_needing_reviews = Game.left_joins(:reviews)
                                       .where(reviews: { user: system_user })
                                       .group('games.id')
                                       .having('COUNT(reviews.id) < 10')
                                       .count.size
            
            render json: {
              total_system_reviews: total_system_reviews,
              games_with_system_reviews: games_with_system_reviews,
              games_needing_system_reviews: games_needing_reviews,
              system_user_id: system_user.id
            }
          else
            render json: {
              total_system_reviews: 0,
              games_with_system_reviews: 0,
              games_needing_system_reviews: Game.count,
              system_user_id: nil,
              message: "システムユーザーが見つかりません"
            }
          end
          
        rescue => e
          Rails.logger.error "システムレビュー統計取得エラー: #{e.message}"
          render json: { 
            error: "統計情報の取得に失敗しました: #{e.message}" 
          }, status: :internal_server_error
        end
      end

      # データベースの統計情報を取得するエンドポイント
      def database_stats
        begin
          stats = {
            total_games: Game.count,
            registered_games: Game.where(registered_on_site: true).count,
            total_users: User.count,
            total_reviews: Review.count,
            user_reviews: Review.joins(:user).where.not(users: { email: 'system@boardgamereview.com' }).count,
            games_with_japanese_names: Game.where.not(japanese_name: [nil, '']).count,
            games_with_japanese_descriptions: Game.where.not(japanese_description: [nil, '']).count,
            recent_activity: {
              games_added_today: Game.where("created_at > ?", 1.day.ago).count,
              reviews_added_today: Review.where("created_at > ?", 1.day.ago).count,
              users_registered_today: User.where("created_at > ?", 1.day.ago).count
            }
          }
          
          render json: stats
          
        rescue => e
          Rails.logger.error "データベース統計取得エラー: #{e.message}"
          render json: { 
            error: "統計情報の取得に失敗しました: #{e.message}" 
          }, status: :internal_server_error
        end
      end

      # ゲーム情報の一括更新を実行するエンドポイント
      def bulk_update_games
        begin
          game_ids = params[:game_ids] || []
          force_update = params[:force_update] == 'true'
          
          if game_ids.empty?
            render json: { error: "更新対象のゲームIDが指定されていません" }, status: :bad_request
            return
          end
          
          # バックグラウンドジョブとして実行
          BulkUpdateGamesJob.perform_later(game_ids, force_update, current_user.id)
          
          render json: { 
            message: "#{game_ids.count}件のゲーム情報の一括更新を開始しました。",
            game_ids: game_ids,
            force_update: force_update
          }, status: :accepted
          
        rescue => e
          Rails.logger.error "ゲーム一括更新開始エラー: #{e.message}"
          render json: { 
            error: "一括更新の開始に失敗しました: #{e.message}" 
          }, status: :internal_server_error
        end
      end

      def create_system_user
        begin
          # システムユーザーが既に存在するかチェック
          existing_user = User.find_by(email: 'system@boardgamereviews.com')
          
          if existing_user
            render json: { 
              message: 'システムユーザーは既に存在します',
              user: {
                id: existing_user.id,
                email: existing_user.email,
                name: existing_user.name
              }
            }
            return
          end
          
          # システムユーザーを作成
          system_user = User.create!(
            email: 'system@boardgamereviews.com',
            name: 'BoardGameGeek',
            password: SecureRandom.hex(20),
            confirmed_at: Time.current,
            is_admin: false
          )
          
          render json: { 
            message: 'システムユーザーを作成しました',
            user: {
              id: system_user.id,
              email: system_user.email,
              name: system_user.name
            }
          }
          
        rescue => e
          render json: { error: "システムユーザー作成エラー: #{e.message}" }, status: 422
        end
      end

      def import_games_data
        begin
          # パラメータからJSONデータを受け取る
          games_data = params[:games_data]
          
          unless games_data.present?
            render json: { error: 'games_dataパラメータが必要です' }, status: 400
            return
          end
          
          # システムユーザーを確認
          system_user = User.find_by(email: 'system@boardgamereviews.com')
          unless system_user
            render json: { error: 'システムユーザーが見つかりません。先にcreate_system_userを実行してください。' }, status: 404
            return
          end
          
          imported_count = 0
          skipped_count = 0
          error_count = 0
          
          games_data.each do |game_data|
            begin
              # 既存ゲームをチェック
              existing_game = Game.find_by(bgg_id: game_data['bgg_id'])
              if existing_game
                skipped_count += 1
                next
              end
              
              # ゲームを作成
              Game.create!(
                title: game_data['title'],
                japanese_name: game_data['japanese_name'],
                bgg_id: game_data['bgg_id'],
                description: game_data['description'],
                japanese_description: game_data['japanese_description'],
                year_published: game_data['year_published'],
                min_players: game_data['min_players'],
                max_players: game_data['max_players'],
                min_playtime: game_data['min_playtime'],
                max_playtime: game_data['max_playtime'],
                min_age: game_data['min_age'],
                complexity: game_data['complexity'],
                bgg_score: game_data['bgg_score'],
                bgg_rank: game_data['bgg_rank'],
                bgg_num_votes: game_data['bgg_num_votes'],
                image_url: game_data['image_url'],
                japanese_image_url: game_data['japanese_image_url'],
                categories: game_data['categories'],
                mechanics: game_data['mechanics'],
                popular_categories: game_data['popular_categories'],
                popular_mechanics: game_data['popular_mechanics'],
                publishers: game_data['publishers'],
                designers: game_data['designers'],
                japanese_publisher: game_data['japanese_publisher'],
                release_date: game_data['release_date'],
                weight: game_data['weight'],
                average_complexity: game_data['average_complexity'],
                average_luck_factor: game_data['average_luck_factor'],
                average_interaction: game_data['average_interaction'],
                average_accessibility: game_data['average_accessibility'],
                average_play_time: game_data['average_play_time'],
                average_score: game_data['average_score'],
                registered_on_site: game_data['registered_on_site'] || false,
                created_at: game_data['created_at'],
                updated_at: game_data['updated_at']
              )
              
              imported_count += 1
              
            rescue => e
              error_count += 1
              Rails.logger.error "Game import error: #{e.message}"
            end
          end
          
          render json: {
            message: 'データインポート完了',
            statistics: {
              imported: imported_count,
              skipped: skipped_count,
              errors: error_count,
              total_processed: games_data.length
            }
          }
          
        rescue => e
          render json: { error: "インポートエラー: #{e.message}" }, status: 422
        end
      end

      private

      # 管理者権限の確認
      def authenticate_admin!
        unless admin_user?
          render json: { error: "管理者権限が必要です" }, status: :forbidden
        end
      end

      # 管理者ユーザーかどうかをチェック
      def admin_user?
        current_user&.email&.end_with?('@boardgamereview.com') || current_user&.email == 'admin@example.com'
      end
    end
  end
end 