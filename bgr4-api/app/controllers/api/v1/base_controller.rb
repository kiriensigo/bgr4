# frozen_string_literal: true

module Api
  module V1
    class BaseController < ApplicationController
      # protect_from_forgery with: :null_session
      include DeviseTokenAuth::Concerns::SetUserByToken
      include ApiResponse
      include ApiPagination
      include ApiErrorHandling
      
      # API共通設定
      before_action :set_default_response_format
      before_action :log_request_info
      
      private
      
      def set_default_response_format
        request.format = :json
      end
      
      def log_request_info
        Rails.logger.info "API Request: #{request.method} #{request.path}"
        Rails.logger.info "Params: #{params.except(:controller, :action).to_unsafe_h}" if params.present?
      end
      
      # 認証が必要なアクション用のヘルパー
      def authenticate_user_with_response!
        unless current_user
          unauthorized_response
          return false
        end
        true
      end
      
      # 管理者権限チェック
      def ensure_admin!
        unless admin_user?
          forbidden_response("管理者権限が必要です")
          return false
        end
        true
      end
      
      # レビュー数チェック（ゲーム登録時など）
      def ensure_sufficient_reviews!(required_count = 5)
        unless admin_user? || has_enough_reviews?(required_count)
          forbidden_response("ゲーム登録には#{required_count}件以上のレビューが必要です")
          return false
        end
        true
      end
    end
  end
end 