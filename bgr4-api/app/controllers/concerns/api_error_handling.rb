# frozen_string_literal: true

module ApiErrorHandling
  extend ActiveSupport::Concern
  
  included do
    rescue_from StandardError, with: :handle_standard_error
    rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_validation_error
    rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing
  end
  
  private
  
  def handle_standard_error(exception)
    Rails.logger.error "Unexpected error: #{exception.message}"
    Rails.logger.error exception.backtrace.join("\n")
    
    error_response(
      "予期せぬエラーが発生しました", 
      :internal_server_error,
      Rails.env.development? ? exception.message : nil
    )
  end
  
  def handle_not_found(exception)
    Rails.logger.info "Record not found: #{exception.message}"
    not_found_response
  end
  
  def handle_validation_error(exception)
    Rails.logger.info "Validation error: #{exception.record.errors.full_messages}"
    validation_error_response(exception.record)
  end
  
  def handle_parameter_missing(exception)
    Rails.logger.info "Parameter missing: #{exception.message}"
    error_response("必須パラメータが不足しています: #{exception.param}", :bad_request)
  end
  
  # BGG API エラー専用ハンドリング
  def handle_bgg_api_error(error_message)
    Rails.logger.warn "BGG API Error: #{error_message}"
    error_response(
      "BGGからのデータ取得に失敗しました", 
      :service_unavailable,
      error_message
    )
  end
  
  # 外部サービス エラー専用ハンドリング
  def handle_external_service_error(service_name, error_message)
    Rails.logger.warn "#{service_name} Error: #{error_message}"
    error_response(
      "外部サービスとの通信に失敗しました", 
      :service_unavailable,
      "#{service_name}: #{error_message}"
    )
  end
end 