module Api
  module V1
    class WishlistItemsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_wishlist_item, only: [:destroy]
      
      # GET /api/v1/wishlist_items
      def index
        # リクエストパラメータをログに出力
        Rails.logger.info "Request: #{request.method} #{request.url}"
        Rails.logger.info "Parameters: #{params.inspect}"
        
        # includes(:game)を削除し、単純にorder(position: :asc)だけにする
        @wishlist_items = current_user.wishlist_items.order(position: :asc)
        
        render json: @wishlist_items.map { |item|
          # 各アイテムのゲーム情報を個別に取得
          game = Game.find_by(bgg_id: item.game)
          {
            id: item.id,
            game_id: item.game,
            position: item.position,
            created_at: item.created_at,
            game: game ? {
              id: game.id,
              bgg_id: game.bgg_id,
              name: game.name,
              japanese_name: game.japanese_name,
              image_url: game.image_url,
              min_players: game.min_players,
              max_players: game.max_players,
              play_time: game.play_time,
              average_score: game.average_score
            } : nil
          }
        }
      end
      
      # POST /api/v1/wishlist_items
      def create
        # リクエストパラメータをログに出力
        Rails.logger.info "Request: #{request.method} #{request.url}"
        Rails.logger.info "Parameters: #{params.inspect}"
        Rails.logger.info "Headers: #{request.headers.to_h.select { |k, v| k.start_with?('HTTP_') }}"
        
        # 認証ヘッダーをログに出力
        auth_headers = request.headers.to_h.select { |k, v| k.start_with?('HTTP_UID', 'HTTP_CLIENT') }
        Rails.logger.info "Auth Headers: #{auth_headers}"
        
        # ゲームが存在するか確認
        game_id = params[:game_id]
        game = Game.find_by(bgg_id: game_id)
        
        unless game
          render json: { error: 'ゲームが見つかりません' }, status: :not_found
          return
        end
        
        # 既存のやりたいリストアイテムをチェック
        existing_item = current_user.wishlist_items.find_by(game: game_id)
        if existing_item
          render json: { 
            id: existing_item.id,
            game_id: existing_item.game,
            position: existing_item.position,
            created_at: existing_item.created_at,
            message: '既にやりたいリストに追加されています'
          }, status: :ok
          return
        end
        
        begin
          # WishlistItemを作成
          @wishlist_item = current_user.wishlist_items.new
          @wishlist_item.game = game_id
          
          if @wishlist_item.save
            render json: {
              id: @wishlist_item.id,
              game_id: @wishlist_item.game,
              position: @wishlist_item.position,
              created_at: @wishlist_item.created_at,
              message: 'やりたいリストに追加しました'
            }, status: :created
          else
            Rails.logger.error "Error saving wishlist item: #{@wishlist_item.errors.full_messages}"
            render json: { error: @wishlist_item.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error occurred: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: "やりたいリストへの追加に失敗しました: #{e.message}" }, status: :internal_server_error
        end
      end
      
      # DELETE /api/v1/wishlist_items/:id
      def destroy
        # リクエストパラメータをログに出力
        Rails.logger.info "Request: #{request.method} #{request.url}"
        Rails.logger.info "Parameters: #{params.inspect}"
        Rails.logger.info "Headers: #{request.headers.to_h.select { |k, v| k.start_with?('HTTP_') }}"
        
        # 認証ヘッダーをログに出力
        auth_headers = request.headers.to_h.select { |k, v| k.start_with?('HTTP_UID', 'HTTP_CLIENT') }
        Rails.logger.info "Auth Headers: #{auth_headers}"
        
        begin
          if @wishlist_item.destroy
            render json: { message: 'やりたいリストから削除しました' }
          else
            Rails.logger.error "Error deleting wishlist item: #{@wishlist_item.errors.full_messages}"
            render json: { error: '削除に失敗しました' }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error occurred: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: "やりたいリストからの削除に失敗しました: #{e.message}" }, status: :internal_server_error
        end
      end
      
      # PUT /api/v1/wishlist_items/reorder
      def reorder
        # リクエストパラメータをログに出力
        Rails.logger.info "Request: #{request.method} #{request.url}"
        Rails.logger.info "Parameters: #{params.inspect}"
        Rails.logger.info "Headers: #{request.headers.to_h.select { |k, v| k.start_with?('HTTP_') }}"
        
        # 認証ヘッダーをログに出力
        auth_headers = request.headers.to_h.select { |k, v| k.start_with?('HTTP_UID', 'HTTP_CLIENT') }
        Rails.logger.info "Auth Headers: #{auth_headers}"
        
        # パラメータからIDと新しい順序を取得
        items_order = params[:items]
        
        begin
          # トランザクションを開始
          ActiveRecord::Base.transaction do
            items_order.each_with_index do |item_id, index|
              wishlist_item = current_user.wishlist_items.find_by(id: item_id)
              if wishlist_item
                wishlist_item.update!(position: index + 1)
              else
                Rails.logger.warn "Wishlist item not found: #{item_id}"
              end
            end
          end
          
          render json: { message: '順序を更新しました' }
        rescue => e
          Rails.logger.error "Error occurred: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end
      
      private
      
      def set_wishlist_item
        @wishlist_item = current_user.wishlist_items.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'アイテムが見つかりません' }, status: :not_found
      end
    end
  end
end
