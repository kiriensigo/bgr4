module Api
  module V1
    class GamesController < ApplicationController
      before_action :authenticate_user!, except: [:index, :show, :search, :hot, :search_by_publisher, :search_by_designer, :version_image]
      before_action :set_game, only: [:show, :update, :destroy]

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
        game_json['reviews'] = reviews_with_users
        
        # 人気のタグ、メカニクス、おすすめプレイ人数を取得
        game_json['popular_categories'] = @game.popular_categories
        game_json['popular_mechanics'] = @game.popular_mechanics
        game_json['recommended_players'] = @game.recommended_players
        game_json['review_count'] = @game.user_review_count
        
        render json: game_json
      end

      def create
        # フロントエンドから送信されたパラメータを取得
        game_params = params[:game]
        
        # パラメータのデバッグ出力
        Rails.logger.info "Creating game with params: #{game_params.inspect}"
        Rails.logger.info "BGG ID: #{game_params[:bgg_id]}"
        Rails.logger.info "Japanese name: #{game_params[:japanese_name]}"
        Rails.logger.info "Japanese publisher: #{game_params[:japanese_publisher]}"
        Rails.logger.info "Japanese release date: #{game_params[:japanese_release_date]}"
        
        bgg_id = game_params[:bgg_id]
        
        # bgg_idがnilの場合はエラーを返す
        if bgg_id.nil?
          render json: { error: "BGG IDが指定されていません" }, status: :unprocessable_entity
          return
        end
        
        # 既存のゲームをチェック
        existing_game = Game.find_by(bgg_id: bgg_id)
        if existing_game
          render json: existing_game, status: :ok
          return
        end
        
        # BGGからゲーム情報を取得
        bgg_game_info = BggService.get_game_details(bgg_id)
        
        if bgg_game_info.nil?
          render json: { error: "BGGからゲーム情報を取得できませんでした" }, status: :unprocessable_entity
          return
        end
        
        # ゲームを作成
        @game = Game.new(
          bgg_id: bgg_id,
          name: game_params[:name],
          japanese_name: game_params[:japanese_name],
          description: game_params[:description],
          japanese_description: game_params[:japanese_description],
          image_url: game_params[:image_url],
          japanese_image_url: game_params[:japanese_image_url],
          min_players: game_params[:min_players],
          max_players: game_params[:max_players],
          play_time: game_params[:play_time],
          min_play_time: game_params[:min_play_time],
          average_score: game_params[:average_score],
          weight: game_params[:weight],
          publisher: game_params[:publisher] || bgg_game_info[:publisher],
          designer: game_params[:designer] || bgg_game_info[:designer],
          release_date: game_params[:release_date] || bgg_game_info[:release_date],
          japanese_publisher: game_params[:japanese_publisher] || bgg_game_info[:japanese_publisher],
          japanese_release_date: game_params[:japanese_release_date] || bgg_game_info[:japanese_release_date],
          expansions: game_params[:expansions] || bgg_game_info[:expansions],
          best_num_players: game_params[:best_num_players] || bgg_game_info[:best_num_players],
          recommended_num_players: game_params[:recommended_num_players] || bgg_game_info[:recommended_num_players],
          categories: game_params[:categories] || bgg_game_info[:categories],
          mechanics: game_params[:mechanics] || bgg_game_info[:mechanics]
        )
        
        # 日本語バージョン情報を取得して追加
        japanese_version_info = BggService.get_japanese_version_info(bgg_id)
        if japanese_version_info
          Rails.logger.info "Found Japanese version info: #{japanese_version_info.inspect}"
          
          # 日本語名が送信されていない場合は、日本語バージョンの名前を使用
          @game.japanese_name ||= japanese_version_info[:name]
          
          # 日本語版の出版社が送信されていない場合は、日本語バージョンの出版社を使用
          @game.japanese_publisher ||= japanese_version_info[:publisher]
          
          # 日本語版の発売日が送信されていない場合は、日本語バージョンの発売日を使用
          @game.japanese_release_date ||= japanese_version_info[:release_date]
          
          # 日本語版の画像URLが送信されていない場合は、日本語バージョンの画像URLを使用
          @game.japanese_image_url ||= japanese_version_info[:image_url]
        end
        
        if @game.save
          render json: @game, status: :created
        else
          render json: @game.errors, status: :unprocessable_entity
        end
      end

      def update
        if @game.update(game_params)
          render json: @game
        else
          render json: @game.errors, status: :unprocessable_entity
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
        
        # 出版社名のバリエーションを生成
        publisher_variations = generate_publisher_variations(publisher)
        
        # 出版社名のバリエーションに基づいてゲームを検索
        base_query = Game.where("publisher ILIKE ANY (ARRAY[?]) OR japanese_publisher ILIKE ANY (ARRAY[?])", 
                          publisher_variations, publisher_variations)
        
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

      private

      def set_game
        @game = Game.find_by(bgg_id: params[:id]) || Game.find_by(id: params[:id])
        
        unless @game
          render json: { error: "ゲームが見つかりません。まだデータベースに登録されていません。" }, status: :not_found
        end
      end

      def game_params
        params.require(:game).permit(
          :bgg_id, :name, :japanese_name, :description, :japanese_description, :image_url, 
          :min_players, :max_players, :play_time, :min_play_time,
          :average_score, :weight, :publisher, :designer, :release_date,
          :japanese_publisher, :japanese_release_date, :japanese_image_url,
          best_num_players: [], recommended_num_players: [], expansions: [],
          categories: [], mechanics: []
        )
      end
      
      # 出版社名のバリエーションを生成するメソッド
      def generate_publisher_variations(publisher)
        # 出版社で検索（正規化された名前も含む）
        normalized_publisher = normalize_publisher_name(publisher)
        
        # 出版社名のバリエーションを作成
        publisher_variations = [publisher, normalized_publisher]
        
        # 括弧を含む場合は括弧の前の部分も検索対象に
        if normalized_publisher.include?(" (")
          base_name = normalized_publisher.split(" (").first
          publisher_variations << base_name
        end
        
        # 英語名と日本語名の対応関係
        english_japanese_mapping = {
          'Hobby Japan' => 'ホビージャパン',
          'Arclight' => 'アークライト',
          'Suki Games' => '数寄ゲームズ',
          'Oink Games' => 'オインクゲームズ',
          'Grounding Inc.' => 'グラウンディング',
          'Asmodee Japan' => 'アズモデージャパン'
        }
        
        # 日本語名と英語名の対応関係
        japanese_english_mapping = {
          'ホビージャパン' => 'Hobby Japan',
          'アークライト' => 'Arclight',
          '数寄ゲームズ' => 'Suki Games',
          'オインクゲームズ' => 'Oink Games',
          'グラウンディング' => 'Grounding Inc.',
          'アズモデージャパン' => 'Asmodee Japan'
        }
        
        # 英語名から日本語名、または日本語名から英語名のバリエーションを追加
        english_japanese_mapping.each do |en, ja|
          if normalized_publisher.include?(en)
            publisher_variations << ja
          end
        end
        
        japanese_english_mapping.each do |ja, en|
          if normalized_publisher.include?(ja)
            publisher_variations << en
          end
        end
        
        # 検索用にワイルドカードを追加
        publisher_variations.uniq.map { |pub| "%#{pub}%" }
      end
      
      # デザイナー名のバリエーションを生成するメソッド
      def generate_designer_variations(designer)
        # デザイナーで検索（正規化された名前も含む）
        normalized_designer = normalize_designer_name(designer)
        
        # 正規化された名前と元の名前の両方で検索
        ["%#{designer}%", "%#{normalized_designer}%"].uniq
      end
      
      def normalize_publisher_name(name)
        return name if name.blank?
        
        # 大文字小文字を統一
        normalized = name.strip.downcase
        
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
          'days of wonder' => 'Days of Wonder',
          'daysofwonder' => 'Days of Wonder',
          'days-of-wonder' => 'Days of Wonder',
          'z-man games' => 'Z-Man Games',
          'z man games' => 'Z-Man Games',
          'zman games' => 'Z-Man Games',
          'zmangames' => 'Z-Man Games',
          'z-mangames' => 'Z-Man Games',
          'fantasy flight games' => 'Fantasy Flight Games',
          'fantasyflightgames' => 'Fantasy Flight Games',
          'fantasy-flight-games' => 'Fantasy Flight Games',
          'ffg' => 'Fantasy Flight Games',
          'rio grande games' => 'Rio Grande Games',
          'riograndegames' => 'Rio Grande Games',
          'rio-grande-games' => 'Rio Grande Games',
          'matagot' => 'Matagot',
          'iello' => 'IELLO',
          'cmon' => 'CMON',
          'cmon limited' => 'CMON',
          'cool mini or not' => 'CMON',
          'coolminiornot' => 'CMON',
          
          # 日本語名の正規化
          'ホビージャパン' => 'ホビージャパン (Hobby Japan)',
          'ホビー・ジャパン' => 'ホビージャパン (Hobby Japan)',
          'ホビージャパン（hobby japan）' => 'ホビージャパン (Hobby Japan)',
          'ホビージャパン(hobby japan)' => 'ホビージャパン (Hobby Japan)',
          'アークライト' => 'アークライト (Arclight)',
          'アーク・ライト' => 'アークライト (Arclight)',
          'アークライト（arclight）' => 'アークライト (Arclight)',
          'アークライト(arclight)' => 'アークライト (Arclight)',
          'アークライトゲームズ' => 'アークライト (Arclight)',
          '数寄ゲームズ' => '数寄ゲームズ (Suki Games)',
          'すきげーむず' => '数寄ゲームズ (Suki Games)',
          '数寄ゲームズ（suki games）' => '数寄ゲームズ (Suki Games)',
          '数寄ゲームズ(suki games)' => '数寄ゲームズ (Suki Games)',
          'オインクゲームズ' => 'オインクゲームズ (Oink Games)',
          'おいんくげーむず' => 'オインクゲームズ (Oink Games)',
          'オインクゲームズ（oink games）' => 'オインクゲームズ (Oink Games)',
          'オインクゲームズ(oink games)' => 'オインクゲームズ (Oink Games)',
          'グラウンディング' => 'グラウンディング (Grounding Inc.)',
          'ぐらうんでぃんぐ' => 'グラウンディング (Grounding Inc.)',
          'グラウンディング（grounding）' => 'グラウンディング (Grounding Inc.)',
          'グラウンディング(grounding)' => 'グラウンディング (Grounding Inc.)',
          'アズモデージャパン' => 'アズモデージャパン (Asmodee Japan)',
          'あずもでーじゃぱん' => 'アズモデージャパン (Asmodee Japan)',
          'アズモデージャパン（asmodee japan）' => 'アズモデージャパン (Asmodee Japan)',
          'アズモデージャパン(asmodee japan)' => 'アズモデージャパン (Asmodee Japan)',
          'テンデイズゲームズ' => 'テンデイズゲームズ',
          'てんでいずげーむず' => 'テンデイズゲームズ',
          'ニューゲームズオーダー' => 'ニューゲームズオーダー',
          'にゅーげーむずおーだー' => 'ニューゲームズオーダー',
          'すごろくや' => 'すごろくや',
          'コロンアーク' => 'コロンアーク',
          'ころんあーく' => 'コロンアーク',
          'アナログランチボックス' => 'アナログランチボックス',
          'あなろぐらんちぼっくす' => 'アナログランチボックス',
          'ドミナゲームズ' => 'ドミナゲームズ',
          'どみなげーむず' => 'ドミナゲームズ',
          'おかずブランド' => 'おかずブランド',
          'ジェリージェリーゲームズ' => 'ジェリージェリーゲームズ',
          'じぇりーじぇりーげーむず' => 'ジェリージェリーゲームズ',
          'いつつ' => 'いつつ',
          '遊歩堂' => '遊歩堂',
          'ゆうほどう' => '遊歩堂',
          'ヨクトゲームズ' => 'ヨクトゲームズ',
          'よくとげーむず' => 'ヨクトゲームズ',
          'タコアシゲームズ' => 'タコアシゲームズ',
          'たこあしげーむず' => 'タコアシゲームズ',
          '耐気圏内ゲームズ' => '耐気圏内ゲームズ',
          'たいきけんないげーむず' => '耐気圏内ゲームズ',
          'チーム彩園' => 'チーム彩園',
          'ちーむさいえん' => 'チーム彩園',
        }
        
        # マッピングに存在する場合は正規化された名前を返す
        publisher_mapping[normalized] || name
      end
      
      # デザイナー名を正規化するメソッド
      def normalize_designer_name(name)
        return name if name.blank?
        
        # 大文字小文字を統一
        normalized = name.strip.downcase
        
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
        
        # マッピングに存在する場合は正規化された名前を返す
        designer_mapping[normalized] || name
      end
    end
  end
end
