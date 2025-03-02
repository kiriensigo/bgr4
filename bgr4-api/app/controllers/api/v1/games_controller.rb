module Api
  module V1
    class GamesController < ApplicationController
      before_action :authenticate_user!, except: [:index, :show, :search, :hot, :search_by_publisher, :search_by_designer, :version_image]
      before_action :set_game, only: [:show, :update, :destroy]

      def index
        @games = Game.all.order(created_at: :desc)
        render json: @games
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
        game_json['popular_tags'] = @game.popular_tags
        game_json['popular_mechanics'] = @game.popular_mechanics
        game_json['recommended_players'] = @game.recommended_players
        game_json['review_count'] = @game.review_count
        
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
        
        begin
          # フロントエンドから送信されたデータを使用してゲームを作成
          @game = Game.new(
            bgg_id: bgg_id,
            name: game_params[:name],
            japanese_name: game_params[:japanese_name],
            description: game_params[:description],
            image_url: game_params[:image_url],
            min_players: game_params[:min_players],
            max_players: game_params[:max_players],
            play_time: game_params[:play_time],
            min_play_time: game_params[:min_play_time],
            average_score: game_params[:average_score],
            weight: game_params[:weight],
            publisher: game_params[:publisher],
            designer: game_params[:designer],
            release_date: game_params[:release_date],
            japanese_release_date: game_params[:japanese_release_date],
            japanese_publisher: game_params[:japanese_publisher],
            japanese_image_url: game_params[:japanese_image_url],
            expansions: game_params[:expansions],
            best_num_players: game_params[:best_num_players],
            recommended_num_players: game_params[:recommended_num_players]
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
        rescue => e
          Rails.logger.error "Error creating game: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
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
        
        if query.blank?
          render json: { error: "検索クエリが必要です" }, status: :bad_request
          return
        end
        
        # 日本語名、英語名、出版社、デザイナーで検索
        @games = Game.where("name ILIKE ? OR japanese_name ILIKE ? OR publisher ILIKE ? OR designer ILIKE ?", 
                            "%#{query}%", "%#{query}%", "%#{query}%", "%#{query}%")
                     .order(created_at: :desc)
        
        render json: @games
      end

      def search_by_publisher
        publisher = params[:publisher]
        
        if publisher.blank?
          render json: { error: "出版社名が必要です" }, status: :bad_request
          return
        end
        
        # 出版社で検索（正規化された名前も含む）
        normalized_publisher = normalize_publisher_name(publisher)
        
        # 正規化された名前と元の名前の両方で検索
        @games = Game.where("publisher ILIKE ? OR publisher ILIKE ? OR japanese_publisher ILIKE ? OR japanese_publisher ILIKE ?", 
                           "%#{publisher}%", "%#{normalized_publisher}%", "%#{publisher}%", "%#{normalized_publisher}%")
                    .order(created_at: :desc)
        
        render json: @games
      end
      
      def search_by_designer
        designer = params[:designer]
        
        if designer.blank?
          render json: { error: "デザイナー名が必要です" }, status: :bad_request
          return
        end
        
        # デザイナーで検索（正規化された名前も含む）
        normalized_designer = normalize_designer_name(designer)
        
        # 正規化された名前と元の名前の両方で検索
        @games = Game.where("designer ILIKE ? OR designer ILIKE ?", 
                           "%#{designer}%", "%#{normalized_designer}%")
                    .order(created_at: :desc)
        
        render json: @games
      end

      def hot
        # 人気のゲームを取得（レビュー数が多い順）
        @games = Game.left_joins(:reviews)
                     .group(:id)
                     .order('COUNT(reviews.id) DESC, games.average_score DESC')
                     .limit(10)
        
        render json: @games
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
          Rails.logger.error "Game not found with bgg_id or id: #{params[:id]}"
          render json: { error: "ゲームID: #{params[:id]}はまだデータベースに登録されていません。検索画面から登録できます。" }, status: :not_found
        end
      end

      def game_params
        params.require(:game).permit(
          :bgg_id, :name, :japanese_name, :description, :japanese_description, 
          :image_url, :japanese_image_url, :min_players, :max_players, :play_time, :min_play_time,
          :average_score, :weight, :publisher, :designer, :release_date, 
          :japanese_release_date, :japanese_publisher, best_num_players: [], 
          recommended_num_players: [], expansions: []
        )
      end
      
      # 出版社名を正規化するメソッド
      def normalize_publisher_name(name)
        return name if name.blank?
        
        # 大文字小文字を統一
        normalized = name.strip.downcase
        
        # 出版社名の正規化ルール
        publisher_mapping = {
          # 英語名の正規化
          'hobby japan' => 'Hobby Japan',
          'hobbyjapan' => 'Hobby Japan',
          'arclight' => 'Arclight',
          'arc light' => 'Arclight',
          'suki games' => 'Suki Games',
          'sukigames' => 'Suki Games',
          'oink games' => 'Oink Games',
          'oinkgames' => 'Oink Games',
          'grounding' => 'Grounding Inc.',
          'grounding inc' => 'Grounding Inc.',
          'grounding inc.' => 'Grounding Inc.',
          'asmodee' => 'Asmodee',
          'asmodee japan' => 'Asmodee Japan',
          'asmodeejapan' => 'Asmodee Japan',
          'days of wonder' => 'Days of Wonder',
          'daysofwonder' => 'Days of Wonder',
          'z-man games' => 'Z-Man Games',
          'z man games' => 'Z-Man Games',
          'zman games' => 'Z-Man Games',
          'zmangames' => 'Z-Man Games',
          'fantasy flight games' => 'Fantasy Flight Games',
          'fantasyflightgames' => 'Fantasy Flight Games',
          'ffg' => 'Fantasy Flight Games',
          'rio grande games' => 'Rio Grande Games',
          'riograndegames' => 'Rio Grande Games',
          'matagot' => 'Matagot',
          'iello' => 'IELLO',
          'cmon' => 'CMON',
          'cmon limited' => 'CMON',
          'cool mini or not' => 'CMON',
          'coolminiornot' => 'CMON',
          
          # 日本語名の正規化
          'ホビージャパン' => 'ホビージャパン (Hobby Japan)',
          'ホビー・ジャパン' => 'ホビージャパン (Hobby Japan)',
          'アークライト' => 'アークライト (Arclight)',
          'アーク・ライト' => 'アークライト (Arclight)',
          '数寄ゲームズ' => '数寄ゲームズ (Suki Games)',
          'すきげーむず' => '数寄ゲームズ (Suki Games)',
          'オインクゲームズ' => 'オインクゲームズ (Oink Games)',
          'おいんくげーむず' => 'オインクゲームズ (Oink Games)',
          'グラウンディング' => 'グラウンディング (Grounding Inc.)',
          'ぐらうんでぃんぐ' => 'グラウンディング (Grounding Inc.)',
          'アズモデージャパン' => 'アズモデージャパン (Asmodee Japan)',
          'あずもでーじゃぱん' => 'アズモデージャパン (Asmodee Japan)',
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
