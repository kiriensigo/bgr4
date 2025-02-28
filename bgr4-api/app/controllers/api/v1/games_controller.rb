module Api
  module V1
    class GamesController < ApplicationController
      before_action :authenticate_user!, except: [:index, :show, :search, :hot]
      before_action :set_game, only: [:show, :update, :destroy]

      def index
        @games = Game.all.order(created_at: :desc)
        render json: @games
      end

      def show
        render json: @game.as_json(include: [:reviews])
      end

      def create
        # BGG APIからゲーム情報を取得
        bgg_id = params[:bgg_id]
        
        # 既存のゲームをチェック
        existing_game = Game.find_by(bgg_id: bgg_id)
        if existing_game
          render json: existing_game, status: :ok
          return
        end
        
        # BGG APIからゲーム情報を取得
        game_details = BggService.get_game_details(bgg_id)
        
        if game_details.nil?
          render json: { error: "BGG APIからゲーム情報を取得できませんでした" }, status: :unprocessable_entity
          return
        end
        
        # ゲームを作成
        @game = Game.new(
          bgg_id: game_details[:bgg_id],
          name: game_details[:name],
          japanese_name: game_details[:japanese_name],
          description: game_details[:description],
          image_url: game_details[:image_url],
          min_players: game_details[:min_players],
          max_players: game_details[:max_players],
          play_time: game_details[:play_time],
          min_play_time: game_details[:min_play_time],
          average_score: game_details[:average_score],
          weight: game_details[:weight],
          publisher: game_details[:publisher],
          designer: game_details[:designer],
          release_date: game_details[:release_date],
          japanese_release_date: game_details[:japanese_release_date],
          expansions: game_details[:expansions],
          base_game: game_details[:base_game]
        )
        
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

      def hot
        # 人気のゲームを取得（レビュー数が多い順）
        @games = Game.left_joins(:reviews)
                     .group(:id)
                     .order('COUNT(reviews.id) DESC, games.average_score DESC')
                     .limit(10)
        
        render json: @games
      end

      private

      def set_game
        @game = Game.find(params[:id])
      end

      def game_params
        params.require(:game).permit(
          :bgg_id, :name, :japanese_name, :description, :japanese_description, 
          :image_url, :japanese_image_url, :min_players, :max_players, :play_time, :min_play_time,
          :average_score, :weight, :publisher, :designer, :release_date, 
          :japanese_release_date, :japanese_publisher, best_num_players: [], 
          recommended_num_players: [], expansions: [], base_game: []
        )
      end
    end
  end
end
