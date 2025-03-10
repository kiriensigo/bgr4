module Api
  module V1
    class GamesController < ApplicationController
      before_action :authenticate_user!, except: [:index, :show, :search, :hot, :search_by_publisher, :search_by_designer, :version_image]
      before_action :set_game, only: [:show, :update, :destroy, :update_from_bgg, :update_system_reviews]
      before_action :authenticate_admin!, only: [:update_system_reviews]

      def index
        # ページネーションパラメータを取得
        page = params[:page].present? ? params[:page].to_i : 1
        per_page = params[:per_page].present? ? params[:per_page].to_i : 24
        
        # ソートパラメータを取得（デフォルトはレビュー新着順）
        sort_by = params[:sort_by].present? ? params[:sort_by] : 'review_date'
        
        # 総ゲーム数を取得
        total_count = Game.count
        
        # ソート順に応じてクエリを構築
        query = Game.all
        
        case sort_by
        when 'reviews_count'
          # レビュー数でソート（多い順）
          query = Game.left_joins(:reviews)
                      .group('games.id')
                      .select('games.*, COUNT(reviews.id) as reviews_count_value')
                      .order('reviews_count_value DESC')
        when 'average_score'
          # 平均スコアでソート（高い順）
          query = Game.left_joins(:reviews)
                      .group('games.id')
                      .select('games.*, AVG(reviews.overall_score) as average_score_value')
                      .order('average_score_value DESC NULLS LAST')
        when 'review_date'
          # 最新レビュー日時でソート
          system_user_id = User.find_by(email: 'system@boardgamereview.com')&.id
          
          # システムユーザーのレビューを除外するが、レビューがないゲームも含める
          query = Game.left_joins(:reviews)
                      .where("reviews.id IS NULL OR reviews.user_id != ?", system_user_id)
                      .group('games.id')
                      .select('games.*, MAX(reviews.created_at) as latest_review_date')
                      .order('latest_review_date DESC NULLS LAST, games.created_at DESC')
        else
          # デフォルトは登録日時順（新しい順）
          query = query.order(created_at: :desc)
        end
        
        # ページネーションを適用
        @games = query.limit(per_page).offset((page - 1) * per_page)
        
        # ゲーム一覧にレビュー数とレビュー情報を含める
        games_with_reviews = @games.map do |game|
          game_json = game.as_json
          game_json['reviews_count'] = game.user_review_count
          
          # レビュー情報を含める（システムユーザーを除外）
          reviews = game.reviews.exclude_system_user.order(created_at: :desc).limit(5).map do |review|
            {
              created_at: review.created_at,
              user: {
                id: review.user.id,
                name: review.user.name,
                email: review.user.email
              }
            }
          end
          
          game_json['reviews'] = reviews
          game_json
        end
        
        # ページネーション情報を含めたレスポンスを返す
        render json: {
          games: games_with_reviews,
          pagination: {
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil,
            current_page: page,
            per_page: per_page
          }
        }
      end

      def show
        # @gameはset_gameメソッドで設定済み
        
        # ゲームが見つからない場合は404エラーを返す
        unless @game
          render json: { error: "ゲームが見つかりません" }, status: :not_found
          return
        end
        
        # レビューにユーザー情報を含める（システムユーザーのレビューを除外）
        reviews_with_users = @game.reviews.exclude_system_user.includes(:user).map do |review|
          review_json = review.as_json
          review_json['user'] = {
            id: review.user.id,
            name: review.user.name,
            image: review.user.image
          }
          review_json
        end
        
        game_json = @game.as_json
        
        # 日本語名が「Japanese edition」などの英語表記のみの場合はnilに設定
        if game_json['japanese_name'] && !game_json['japanese_name'].match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
          game_json['japanese_name'] = nil
        end
        
        game_json['reviews'] = reviews_with_users
        
        # 人気のタグ、メカニクス、おすすめプレイ人数を取得
        game_json['popular_categories'] = @game.popular_categories
        game_json['popular_mechanics'] = @game.popular_mechanics
        game_json['recommended_players'] = @game.recommended_players
        game_json['site_recommended_players'] = @game.site_recommended_players
        game_json['review_count'] = @game.user_review_count
        
        # 評価値を追加
        game_json['average_rule_complexity'] = @game.average_rule_complexity
        game_json['average_luck_factor'] = @game.average_luck_factor
        game_json['average_interaction'] = @game.average_interaction
        game_json['average_downtime'] = @game.average_downtime
        game_json['average_overall_score'] = @game.average_overall_score
        
        render json: game_json
      end

      def create
        # デバッグログ - 受け取ったパラメータを記録
        Rails.logger.info "Received params: #{params.inspect}"
        
        # フロントエンドから送信されたパラメータを取得
        game_params = params[:game]
        
        # 手動登録モードかどうかを確認（文字列の'true'またはboolean値のtrueを受け付ける）
        manual_registration = params[:manual_registration] == 'true' || params[:manual_registration] == true
        
        # デバッグログ
        Rails.logger.info "Manual registration flag: #{params[:manual_registration].inspect}, Evaluated as: #{manual_registration}"
        
        if manual_registration
          # 手動登録の場合
          create_manual_game
          return
        end
        
        # パラメータが不足している場合はエラーを返す
        if game_params.blank? || game_params[:bgg_id].blank?
          render json: { error: "BGG IDが必要です" }, status: :bad_request
          return
        end
        
        # BGG IDを取得
        bgg_id = game_params[:bgg_id]
        
        # 既存のゲームを検索
        existing_game = Game.find_by(bgg_id: bgg_id)
        
        if existing_game
          # 既存のゲームが見つかった場合は、登録済みフラグを更新
          existing_game.update(registered_on_site: true)
          
          render json: existing_game, serializer: GameSerializer, scope: current_user, scope_name: :current_user
          return
        end
        
        # BGGからゲーム情報を取得
        bgg_game_info = BggService.get_game_details(bgg_id)
        
        if bgg_game_info.nil?
          render json: { error: "ゲーム情報の更新に失敗しました" }, status: :not_found
          return
        end
        
        # 日本語版情報を取得
        japanese_version_info = BggService.get_japanese_version_info(bgg_id)
        
        # 説明文を翻訳（DeepL APIを使用）
        japanese_description = nil
        if game_params[:japanese_description].blank? && bgg_game_info[:description].present?
          begin
            # 説明文を翻訳
            japanese_description = DeeplTranslationService.translate(bgg_game_info[:description])
            Rails.logger.info "Translated description using DeepL API"
          rescue => e
            Rails.logger.error "Failed to translate description: #{e.message}"
          end
        end
        
        # ゲームを作成
        @game = Game.new(
          bgg_id: bgg_id,
          name: game_params[:name] || bgg_game_info[:name],
          japanese_name: game_params[:japanese_name] || bgg_game_info[:japanese_name],
          description: game_params[:description] || bgg_game_info[:description],
          japanese_description: game_params[:japanese_description] || japanese_description,
          image_url: game_params[:image_url] || bgg_game_info[:image_url],
          japanese_image_url: game_params[:japanese_image_url] || bgg_game_info[:japanese_image_url],
          min_players: game_params[:min_players] || bgg_game_info[:min_players],
          max_players: game_params[:max_players] || bgg_game_info[:max_players],
          play_time: game_params[:play_time] || bgg_game_info[:play_time],
          min_play_time: game_params[:min_play_time] || bgg_game_info[:min_play_time],
          weight: game_params[:weight] || bgg_game_info[:weight],
          publisher: game_params[:publisher] || bgg_game_info[:publisher],
          designer: game_params[:designer] || bgg_game_info[:designer],
          release_date: game_params[:release_date] || bgg_game_info[:release_date],
          japanese_publisher: game_params[:japanese_publisher] || bgg_game_info[:japanese_publisher],
          japanese_release_date: game_params[:japanese_release_date] || bgg_game_info[:japanese_release_date],
          registered_on_site: true
        )
        
        # メタデータを設定
        @game.store_metadata(:expansions, bgg_game_info[:expansions]) if bgg_game_info[:expansions].present?
        @game.store_metadata(:best_num_players, bgg_game_info[:best_num_players]) if bgg_game_info[:best_num_players].present?
        @game.store_metadata(:recommended_num_players, bgg_game_info[:recommended_num_players]) if bgg_game_info[:recommended_num_players].present?
        @game.store_metadata(:categories, bgg_game_info[:categories]) if bgg_game_info[:categories].present?
        @game.store_metadata(:mechanics, bgg_game_info[:mechanics]) if bgg_game_info[:mechanics].present?
        
        # 拡張ゲームかどうかを保存
        @game.store_metadata(:is_expansion, bgg_game_info[:is_expansion]) if bgg_game_info[:is_expansion].present?
        
        # 親ゲーム（基本ゲーム）の情報を保存
        @game.store_metadata(:base_game, bgg_game_info[:base_game]) if bgg_game_info[:base_game].present?
        
        # 日本語版情報が取得できた場合は補完
        if japanese_version_info.present?
          @game.japanese_name ||= japanese_version_info[:name]
          @game.japanese_publisher ||= japanese_version_info[:publisher]
          @game.japanese_release_date ||= japanese_version_info[:release_date]
          @game.japanese_image_url ||= japanese_version_info[:image_url]
        end
        
        # 日本語出版社名を正規化
        @game.normalize_japanese_publisher if @game.japanese_publisher.present?
        
        if @game.save
          # 初期レビューを作成
          @game.create_initial_reviews
          
          render json: @game, serializer: GameSerializer, scope: current_user, scope_name: :current_user
        else
          render json: { errors: @game.errors }, status: :unprocessable_entity
        end
      end

      # 手動登録用のメソッド
      def create_manual_game
        # フロントエンドから送信されたパラメータを取得
        game_params = params[:game]
        
        # デバッグログ
        Rails.logger.info "Manual game params: #{game_params.inspect}"
        Rails.logger.info "Manual registration flag: #{params[:manual_registration].inspect}"
        Rails.logger.info "Use Japanese name as ID flag: #{params[:use_japanese_name_as_id].inspect}"
        
        # パラメータが不足している場合はエラーを返す
        if game_params.blank? || game_params[:japanese_name].blank?
          render json: { error: "ゲーム名が必要です" }, status: :bad_request
          return
        end
        
        # 同じ日本語名のゲームが既に存在するかチェック
        existing_game_by_name = Game.find_by(japanese_name: game_params[:japanese_name])
        if existing_game_by_name
          Rails.logger.info "Game with the same Japanese name already exists: #{existing_game_by_name.bgg_id}"
          render json: { error: "同じ日本語名のゲームが既に登録されています", existing_game_id: existing_game_by_name.bgg_id }, status: :conflict
          return
        end
        
        # 必須項目のチェック
        if game_params[:japanese_image_url].blank?
          render json: { error: "日本語版画像URLが必要です" }, status: :bad_request
          return
        end
        
        if game_params[:min_players].blank?
          render json: { error: "最少プレイ人数が必要です" }, status: :bad_request
          return
        end
        
        if game_params[:max_players].blank?
          render json: { error: "最大プレイ人数が必要です" }, status: :bad_request
          return
        end
        
        if game_params[:play_time].blank?
          render json: { error: "プレイ時間が必要です" }, status: :bad_request
          return
        end
        
        # 常に日本語名をIDとして使用する
        use_japanese_name_as_id = true
        
        if use_japanese_name_as_id && game_params[:japanese_name].present?
          # 日本語名をIDとして使用する場合は、ASCII文字列に変換する
          # 日本語名をBase64エンコードしてASCII文字列に変換
          require 'base64'
          encoded_name = Base64.strict_encode64(game_params[:japanese_name])
          manual_bgg_id = "jp-#{encoded_name}"
          Rails.logger.info "Using encoded Japanese name as ID: #{manual_bgg_id}"
        else
          # 従来の方法でIDを生成
          timestamp = Time.now.to_i
          random_suffix = SecureRandom.hex(4)
          manual_bgg_id = "manual-#{timestamp}-#{random_suffix}"
          Rails.logger.info "Using generated ID: #{manual_bgg_id}"
        end
        
        # 英語名の処理（空の場合は日本語名を使用）
        name_to_use = game_params[:name].present? ? game_params[:name] : game_params[:japanese_name]
        Rails.logger.info "Using name: #{name_to_use} (original name: #{game_params[:name].inspect}, japanese_name: #{game_params[:japanese_name].inspect})"
        
        # ゲームを作成
        @game = Game.new(
          bgg_id: manual_bgg_id,
          name: name_to_use,
          japanese_name: game_params[:japanese_name],
          japanese_description: game_params[:japanese_description],
          japanese_image_url: game_params[:japanese_image_url],
          min_players: game_params[:min_players],
          max_players: game_params[:max_players],
          play_time: game_params[:play_time],
          min_play_time: game_params[:min_play_time],
          japanese_publisher: game_params[:japanese_publisher],
          japanese_release_date: game_params[:japanese_release_date],
          designer: game_params[:designer],
          registered_on_site: true
        )
        
        # 日本語出版社名を正規化
        @game.normalize_japanese_publisher if @game.japanese_publisher.present?
        
        # 保存前にバリデーションチェック
        if @game.valid?
          Rails.logger.info "Game is valid, saving..."
        else
          Rails.logger.error "Game validation failed: #{@game.errors.full_messages.join(', ')}"
        end
        
        if @game.save
          # 初期レビューを作成（手動登録フラグをtrueで渡す）
          @game.create_initial_reviews(true)
          
          # 編集履歴を作成
          @game.create_edit_history({}, @game.attributes, current_user)
          
          render json: @game, serializer: GameSerializer, scope: current_user, scope_name: :current_user
        else
          # より詳細なエラーメッセージを返す
          Rails.logger.error "Game save failed: #{@game.errors.full_messages.join(', ')}"
          Rails.logger.error "Game attributes: #{@game.attributes.inspect}"
          render json: { errors: @game.errors.messages }, status: :unprocessable_entity
        end
      end

      def update
        if @game.update(game_params)
          # 日本語出版社名を正規化
          @game.normalize_japanese_publisher
          
          render json: @game, serializer: GameSerializer, scope: current_user, scope_name: :current_user
        else
          render json: { errors: @game.errors }, status: :unprocessable_entity
        end
      end

      # BGGからゲーム情報を更新するエンドポイント
      def update_from_bgg
        # 強制更新フラグがある場合は、既存の値も上書きする
        force_update = params[:force_update] == 'true'
        
        # 古い属性を保存
        old_attrs = @game.attributes.dup
        
        # ゲーム情報をBGGから更新
        if @game.update_from_bgg(force_update)
          # 変更があった場合は編集履歴を作成
          if @game.changed?
            if @game.save
              # 編集履歴を作成
              @game.create_edit_history(old_attrs, @game.attributes, current_user || 'system')
            else
              render json: { errors: @game.errors }, status: :unprocessable_entity
              return
            end
          end
          
          render json: @game, serializer: GameSerializer, scope: current_user, scope_name: :current_user
        else
          render json: { error: "ゲーム情報の更新に失敗しました" }, status: :unprocessable_entity
        end
      end

      def destroy
        @game.destroy
        head :no_content
      end

      def search
        query = params[:query]
        publisher = params[:publisher]
        min_players = params[:min_players]
        max_players = params[:max_players]
        play_time_min = params[:play_time_min]
        play_time_max = params[:play_time_max]
        
        # レビュー関連のパラメータ
        use_reviews_categories = params[:use_reviews_categories] == 'true'
        use_reviews_mechanics = params[:use_reviews_mechanics] == 'true'
        use_reviews_recommended_players = params[:use_reviews_recommended_players] == 'true'
        
        # ページネーションパラメータを取得
        page = params[:page].present? ? params[:page].to_i : 1
        per_page = params[:per_page].present? ? params[:per_page].to_i : 24
        
        # ソートパラメータを取得（デフォルトはレビュー新着順）
        sort_by = params[:sort_by].present? ? params[:sort_by] : 'review_date'
        
        # 検索条件が何もない場合でもすべてのゲームを返す
        # 検索条件を構築
        base_query = Game.all
        
        # キーワード検索
        if query.present?
          base_query = base_query.where("name ILIKE ? OR japanese_name ILIKE ? OR publisher ILIKE ? OR designer ILIKE ?", 
                                         "%#{query}%", "%#{query}%", "%#{query}%", "%#{query}%")
        end
        
        # 出版社検索
        if publisher.present?
          publisher_variations = generate_publisher_variations(publisher)
          
          # 検索条件を構築
          publisher_conditions = publisher_variations.map do |pub|
            "publisher ILIKE ? OR japanese_publisher ILIKE ?"
          end.join(" OR ")
          
          publisher_values = publisher_variations.flat_map do |pub|
            ["%#{pub}%", "%#{pub}%"]
          end
          
          base_query = base_query.where(publisher_conditions, *publisher_values)
        end
        
        # プレイ人数検索
        if min_players.present?
          base_query = base_query.where("min_players <= ?", min_players.to_i)
        end
        
        if max_players.present?
          base_query = base_query.where("max_players >= ?", max_players.to_i)
        end
        
        # プレイ時間検索
        if play_time_min.present?
          play_time_min_value = play_time_min.to_i
          base_query = base_query.where("play_time >= ?", play_time_min_value)
        end
        
        if play_time_max.present?
          play_time_max_value = play_time_max.to_i
          # 180以上（999）の場合は上限なしとして扱う
          if play_time_max_value >= 180
            # 上限なし（何もしない）
          else
            base_query = base_query.where("play_time <= ?", play_time_max_value)
          end
        end
        
        # レビュー関連のパラメータを処理
        # システムユーザーのレビューがあるゲームも含める
        if use_reviews_categories || use_reviews_mechanics || use_reviews_recommended_players
          # システムユーザーを取得
          system_user = User.find_by(email: 'system@boardgamereview.com')
          
          # システムユーザーのレビューがあるゲームのIDを取得
          if system_user
            system_reviewed_game_ids = Review.where(user_id: system_user.id).pluck(:game_id).uniq
            
            # システムユーザーのレビューがあるゲームも含める
            if system_reviewed_game_ids.present?
              base_query = base_query.or(Game.where(bgg_id: system_reviewed_game_ids))
            end
          end
        end
        
        # 総数を取得
        total_count = base_query.count
        
        # ソート順に応じてクエリを構築
        query = base_query
        
        case sort_by
        when 'reviews_count'
          # レビュー数でソート（多い順）
          query = base_query.left_joins(:reviews)
                      .group('games.id')
                      .select('games.*, COUNT(reviews.id) as reviews_count_value')
                      .order('reviews_count_value DESC')
        when 'average_score'
          # 平均スコアでソート（高い順）
          query = base_query.left_joins(:reviews)
                      .group('games.id')
                      .select('games.*, AVG(reviews.overall_score) as average_score_value')
                      .order('average_score_value DESC NULLS LAST')
        when 'review_date'
          # 最新レビュー日時でソート（システムユーザーのレビューも含める）
          query = base_query.left_joins(:reviews)
                      .group('games.id')
                      .select('games.*, MAX(reviews.created_at) as latest_review_date')
                      .order('latest_review_date DESC NULLS LAST')
        else
          # デフォルトは登録日時順（新しい順）
          query = query.order(created_at: :desc)
        end
        
        # ページネーションを適用
        games = query.limit(per_page).offset((page - 1) * per_page)
        
        # レビュー数とレビュー情報を含める
        games_with_reviews = games.map do |game|
          game_json = game.as_json
          game_json['reviews_count'] = game.user_review_count
          
          # レビュー情報を含める（すべてのレビューを含む）
          reviews = game.reviews.order(created_at: :desc).limit(5).map do |review|
            {
              created_at: review.created_at,
              user: {
                id: review.user.id,
                name: review.user.name,
                email: review.user.email
              }
            }
          end
          
          game_json['reviews'] = reviews
          game_json
        end
        
        # ページネーション情報を含めたレスポンスを返す
        render json: {
          games: games_with_reviews,
          pagination: {
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil,
            current_page: page,
            per_page: per_page
          }
        }
      end

      def search_by_publisher
        publisher = params[:publisher]
        
        if publisher.blank?
          render json: { error: "出版社名が指定されていません" }, status: :bad_request
          return
        end
        
        # ページネーションパラメータを取得
        page = params[:page].present? ? params[:page].to_i : 1
        per_page = params[:per_page].present? ? params[:per_page].to_i : 24
        
        # ソートパラメータを取得（デフォルトはレビュー新着順）
        sort_by = params[:sort_by].present? ? params[:sort_by] : 'review_date'
        
        # 出版社名で検索
        base_query = Game.where("publisher ILIKE ? OR japanese_publisher ILIKE ?", 
                          "%#{publisher}%", "%#{publisher}%")
        
        # ソート順に応じてクエリを構築
        query = base_query
        
        case sort_by
        when 'reviews_count'
          # レビュー数でソート（多い順）
          query = base_query.left_joins(:reviews)
                      .group('games.id')
                      .select('games.*, COUNT(reviews.id) as reviews_count_value')
                      .order('reviews_count_value DESC')
        when 'average_score'
          # 平均スコアでソート（高い順）
          query = base_query.left_joins(:reviews)
                      .group('games.id')
                      .select('games.*, AVG(reviews.overall_score) as average_score_value')
                      .order('average_score_value DESC NULLS LAST')
        when 'review_date'
          # 最新レビュー日時でソート
          query = base_query.left_joins(:reviews)
                      .where.not(reviews: { user_id: User.find_by(email: 'system@boardgamereview.com')&.id })
                      .group('games.id')
                      .select('games.*, MAX(reviews.created_at) as latest_review_date')
                      .order('latest_review_date DESC NULLS LAST')
        else
          # デフォルトは登録日時順（新しい順）
          query = query.order(created_at: :desc)
        end
        
        # 総数を取得
        total_count = base_query.count
        
        # ページネーションを適用
        games = query.limit(per_page).offset((page - 1) * per_page)
        
        # レビュー数とレビュー情報を含める
        games_with_reviews = games.map do |game|
          game_json = game.as_json
          game_json['reviews_count'] = game.user_review_count
          
          # レビュー情報を含める（システムユーザーを除外）
          reviews = game.reviews.exclude_system_user.order(created_at: :desc).limit(5).map do |review|
            {
              created_at: review.created_at,
              user: {
                id: review.user.id,
                name: review.user.name,
                email: review.user.email
              }
            }
          end
          
          game_json['reviews'] = reviews
          game_json
        end
        
        # ページネーション情報を含めたレスポンスを返す
        render json: {
          games: games_with_reviews,
          pagination: {
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil,
            current_page: page,
            per_page: per_page
          }
        }
      end
      
      def search_by_designer
        designer = params[:designer]
        
        if designer.blank?
          render json: { error: "デザイナー名が指定されていません" }, status: :bad_request
          return
        end
        
        # ページネーションパラメータを取得
        page = params[:page].present? ? params[:page].to_i : 1
        per_page = params[:per_page].present? ? params[:per_page].to_i : 24
        
        # ソートパラメータを取得（デフォルトはレビュー新着順）
        sort_by = params[:sort_by].present? ? params[:sort_by] : 'review_date'
        
        # デザイナー名のバリエーションを生成
        designer_variations = generate_designer_variations(designer)
        
        # デザイナー名のバリエーションに基づいてゲームを検索
        base_query = Game.where("designer ILIKE ANY (ARRAY[?])", designer_variations)
        
        # ソート順に応じてクエリを構築
        query = base_query
        
        case sort_by
        when 'reviews_count'
          # レビュー数でソート（多い順）
          query = base_query.left_joins(:reviews)
                      .group('games.id')
                      .select('games.*, COUNT(reviews.id) as reviews_count_value')
                      .order('reviews_count_value DESC')
        when 'average_score'
          # 平均スコアでソート（高い順）
          query = base_query.left_joins(:reviews)
                      .group('games.id')
                      .select('games.*, AVG(reviews.overall_score) as average_score_value')
                      .order('average_score_value DESC NULLS LAST')
        when 'review_date'
          # 最新レビュー日時でソート
          query = base_query.left_joins(:reviews)
                      .where.not(reviews: { user_id: User.find_by(email: 'system@boardgamereview.com')&.id })
                      .group('games.id')
                      .select('games.*, MAX(reviews.created_at) as latest_review_date')
                      .order('latest_review_date DESC NULLS LAST')
        else
          # デフォルトは登録日時順（新しい順）
          query = query.order(created_at: :desc)
        end
        
        # 総数を取得
        total_count = base_query.count
        
        # ページネーションを適用
        games = query.limit(per_page).offset((page - 1) * per_page)
        
        # レビュー数とレビュー情報を含める
        games_with_reviews = games.map do |game|
          game_json = game.as_json
          game_json['reviews_count'] = game.user_review_count
          
          # レビュー情報を含める（システムユーザーを除外）
          reviews = game.reviews.exclude_system_user.order(created_at: :desc).limit(5).map do |review|
            {
              created_at: review.created_at,
              user: {
                id: review.user.id,
                name: review.user.name,
                email: review.user.email
              }
            }
          end
          
          game_json['reviews'] = reviews
          game_json
        end
        
        # ページネーション情報を含めたレスポンスを返す
        render json: {
          games: games_with_reviews,
          pagination: {
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil,
            current_page: page,
            per_page: per_page
          }
        }
      end

      def hot
        # システムユーザーを取得
        system_user = User.find_by(email: 'system@boardgamereview.com')
        
        # 人気のゲームを取得（システムユーザー以外のレビュー数が多い順）
        @games = Game.left_joins(:reviews)
                     .where.not(reviews: { user_id: system_user&.id })
                     .group(:id)
                     .order('COUNT(reviews.id) DESC, games.average_score DESC')
                     .limit(10)
        
        # レビュー数を含めたレスポンスを返す
        games_with_reviews = @games.map do |game|
          game_json = game.as_json
          game_json['reviews_count'] = game.user_review_count
          game_json
        end
        
        render json: games_with_reviews
      end

      # バージョン画像を取得するエンドポイント
      def version_image
        version_id = params[:id]
        
        if version_id.blank?
          render json: { error: "バージョンIDが指定されていません" }, status: :bad_request
          return
        end
        
        image_url = BggService.search_version_image_by_id(version_id)
        
        if image_url.present?
          render json: { image_url: image_url }
        else
          render json: { error: "画像が見つかりませんでした" }, status: :not_found
        end
      end

      # システムレビューを更新するアクション
      def update_system_reviews
        if @game.update_system_reviews
          render json: { message: "システムレビューを更新しました" }, status: :ok
        else
          render json: { error: "システムレビューの更新に失敗しました" }, status: :unprocessable_entity
        end
      end

      private

      def set_game
        # IDのデバッグログを出力
        Rails.logger.info "Finding game with ID: #{params[:id]}"
        
        # IDがjp-で始まる場合はエンコードされた日本語名として扱う
        if params[:id].to_s.start_with?('jp-')
          begin
            require 'base64'
            encoded_part = params[:id].to_s.sub(/^jp-/, '')
            
            # Base64デコードを試みる（エンコードされた日本語名の場合）
            begin
              japanese_name = Base64.strict_decode64(encoded_part)
              Rails.logger.info "Decoded Japanese name from ID: #{japanese_name}"
              
              # まずbgg_idで検索し、見つからなければjapanese_nameで検索
              @game = Game.find_by(bgg_id: params[:id])
              
              unless @game
                # japanese_nameで検索
                @game = Game.find_by(japanese_name: japanese_name)
                Rails.logger.info "Found game by Japanese name: #{@game.inspect}"
              end
            rescue => e
              # デコードに失敗した場合は、従来の方法（jp-プレフィックスの直接の日本語名）を試す
              Rails.logger.info "Failed to decode as Base64, trying direct Japanese name"
              japanese_name = encoded_part
              @game = Game.find_by(bgg_id: params[:id]) || Game.find_by(japanese_name: japanese_name)
              Rails.logger.info "Found game by direct Japanese name: #{@game.inspect}"
            end
          rescue => e
            Rails.logger.error "Error processing ID: #{e.message}"
            @game = Game.find_by(bgg_id: params[:id]) || Game.find_by(id: params[:id])
          end
        else
          @game = Game.find_by(bgg_id: params[:id]) || Game.find_by(id: params[:id])
          Rails.logger.info "Found game by ID: #{@game.inspect}"
        end
        
        unless @game
          render json: { error: 'ゲームが見つかりません' }, status: :not_found
        end
      end

      def game_params
        params.require(:game).permit(
          :bgg_id, :name, :japanese_name, :description, :japanese_description, :image_url, 
          :min_players, :max_players, :play_time, :min_play_time,
          :average_score, :weight, :publisher, :designer, :release_date,
          :japanese_publisher, :japanese_release_date, :japanese_image_url, :registered_on_site,
          best_num_players: [], recommended_num_players: [], expansions: [],
          categories: [], mechanics: []
        )
      end
      
      # 出版社名のバリエーションを生成するメソッド
      def generate_publisher_variations(publisher)
        return [publisher] if publisher.blank?
        
        # 大文字小文字を統一
        normalized = publisher.strip.downcase
        
        # 出版社名の正規化ルール
        publisher_mapping = {
          # 英語名の正規化
          'hobby japan' => 'Hobby Japan',
          'hobbyjapan' => 'Hobby Japan',
          'hobby-japan' => 'Hobby Japan',
          'arclight' => 'Arclight',
          'arc light' => 'Arclight',
          'arclight games' => 'Arclight',
          'arclightgames' => 'Arclight',
          'arclight game' => 'Arclight',
          'arc-light' => 'Arclight',
          'suki games' => 'Suki Games',
          'sukigames' => 'Suki Games',
          'suki game' => 'Suki Games',
          'suki-games' => 'Suki Games',
          'oink games' => 'Oink Games',
          'oinkgames' => 'Oink Games',
          'oink game' => 'Oink Games',
          'oink-games' => 'Oink Games',
          'grounding' => 'Grounding Inc.',
          'grounding inc' => 'Grounding Inc.',
          'grounding inc.' => 'Grounding Inc.',
          'grounding games' => 'Grounding Inc.',
          'groundinggames' => 'Grounding Inc.',
          'asmodee' => 'Asmodee',
          'asmodee japan' => 'Asmodee Japan',
          'asmodeejapan' => 'Asmodee Japan',
          'asmodee-japan' => 'Asmodee Japan',
          'ten days games' => 'Ten Days Games',
          'tendays games' => 'Ten Days Games',
          'tendaysgames' => 'Ten Days Games',
          'new games order' => 'New Games Order',
          'newgamesorder' => 'New Games Order',
          'sugorokuya' => 'Sugorokuya',
          'colon arc' => 'Colon Arc',
          'colonarc' => 'Colon Arc',
          'dice tower' => 'Dice Tower',
          'dicetower' => 'Dice Tower',
          'board game japan' => 'Board Game Japan',
          'boardgamejapan' => 'Board Game Japan',
          'game market' => 'Game Market',
          'gamemarket' => 'Game Market',
          'gp' => 'GP',
          'hakoniwagames' => 'Hakoniwa',
          'hakoniwa games' => 'Hakoniwa',
          'hakoniwa' => 'Hakoniwa',
          
          # 日本語名の正規化
          'ホビージャパン' => 'ホビージャパン',
          'ホビー・ジャパン' => 'ホビージャパン',
          'ホビージャパン（hobby japan）' => 'ホビージャパン',
          'ホビージャパン(hobby japan)' => 'ホビージャパン',
          'アークライト' => 'アークライト',
          'アーク・ライト' => 'アークライト',
          'アークライト（arclight）' => 'アークライト',
          'アークライト(arclight)' => 'アークライト',
          'アークライトゲームズ' => 'アークライト',
          '数寄ゲームズ' => '数寄ゲームズ',
          'すきげーむず' => '数寄ゲームズ',
          '数寄ゲームズ（suki games）' => '数寄ゲームズ',
          '数寄ゲームズ(suki games)' => '数寄ゲームズ',
          'オインクゲームズ' => 'オインクゲームズ',
          'おいんくげーむず' => 'オインクゲームズ',
          'オインクゲームズ（oink games）' => 'オインクゲームズ',
          'オインクゲームズ(oink games)' => 'オインクゲームズ',
          'グラウンディング' => 'グラウンディング',
          'ぐらうんでぃんぐ' => 'グラウンディング',
          'グラウンディング（grounding）' => 'グラウンディング',
          'グラウンディング(grounding)' => 'グラウンディング',
          'アズモデージャパン' => 'アズモデージャパン',
          'あずもでーじゃぱん' => 'アズモデージャパン',
          'アズモデージャパン（asmodee japan）' => 'アズモデージャパン',
          'アズモデージャパン(asmodee japan)' => 'アズモデージャパン',
          'テンデイズゲームズ' => 'テンデイズゲームズ',
          'てんでいずげーむず' => 'テンデイズゲームズ',
          'ニューゲームズオーダー' => 'ニューゲームズオーダー',
          'にゅーげーむずおーだー' => 'ニューゲームズオーダー',
          'すごろくや' => 'すごろくや',
          'コロンアーク' => 'コロンアーク',
          'ころんあーく' => 'コロンアーク',
          'ダイスタワー' => 'ダイスタワー',
          'だいすたわー' => 'ダイスタワー',
          'ボードゲームジャパン' => 'ボードゲームジャパン',
          'ぼーどげーむじゃぱん' => 'ボードゲームジャパン',
          'ゲームマーケット' => 'ゲームマーケット',
          'げーむまーけっと' => 'ゲームマーケット',
          'ジーピー' => 'ジーピー',
          'じーぴー' => 'ジーピー',
          'ハコニワ' => 'ハコニワ',
          'はこにわ' => 'ハコニワ',
        }
        
        # マッピングに基づいて正規化
        publisher_mapping.each do |key, value|
          if normalized.include?(key)
            return [value]
          end
        end
        
        # マッピングに該当しない場合は元の名前を返す
        [publisher]
      end
      
      # デザイナー名のバリエーションを生成するメソッド
      def generate_designer_variations(designer)
        return [designer] if designer.blank?
        
        # 大文字小文字を統一
        normalized = designer.strip.downcase
        
        # デザイナー名の正規化ルール
        designer_mapping = {
          # 英語名の正規化
          'reiner knizia' => 'Reiner Knizia',
          'knizia' => 'Reiner Knizia',
          'uwe rosenberg' => 'Uwe Rosenberg',
          'rosenberg' => 'Uwe Rosenberg',
          'stefan feld' => 'Stefan Feld',
          'feld' => 'Stefan Feld',
          'vlaada chvatil' => 'Vlaada Chvátil',
          'chvatil' => 'Vlaada Chvátil',
          'martin wallace' => 'Martin Wallace',
          'wallace' => 'Martin Wallace',
          'alexander pfister' => 'Alexander Pfister',
          'pfister' => 'Alexander Pfister',
          'friedemann friese' => 'Friedemann Friese',
          'friese' => 'Friedemann Friese',
          'vital lacerda' => 'Vital Lacerda',
          'lacerda' => 'Vital Lacerda',
          'jamey stegmaier' => 'Jamey Stegmaier',
          'stegmaier' => 'Jamey Stegmaier',
          'bruno cathala' => 'Bruno Cathala',
          'cathala' => 'Bruno Cathala',
          'antoine bauza' => 'Antoine Bauza',
          'bauza' => 'Antoine Bauza',
          
          # 日本語名の正規化
          'ライナー・クニツィア' => 'ライナー・クニツィア (Reiner Knizia)',
          'クニツィア' => 'ライナー・クニツィア (Reiner Knizia)',
          'ウヴェ・ローゼンベルク' => 'ウヴェ・ローゼンベルク (Uwe Rosenberg)',
          'ローゼンベルク' => 'ウヴェ・ローゼンベルク (Uwe Rosenberg)',
          'シュテファン・フェルト' => 'シュテファン・フェルト (Stefan Feld)',
          'フェルト' => 'シュテファン・フェルト (Stefan Feld)',
          'ヴラーダ・フヴァティル' => 'ヴラーダ・フヴァティル (Vlaada Chvátil)',
          'フヴァティル' => 'ヴラーダ・フヴァティル (Vlaada Chvátil)',
          'マーティン・ウォレス' => 'マーティン・ウォレス (Martin Wallace)',
          'ウォレス' => 'マーティン・ウォレス (Martin Wallace)',
          'アレクサンダー・プフィスター' => 'アレクサンダー・プフィスター (Alexander Pfister)',
          'プフィスター' => 'アレクサンダー・プフィスター (Alexander Pfister)',
        }
        
        # マッピングに基づいて正規化
        designer_mapping.each do |key, value|
          if normalized.include?(key)
            return [value]
          end
        end
        
        # マッピングに該当しない場合は元の名前を返す
        [designer]
      end
    end
  end
end
