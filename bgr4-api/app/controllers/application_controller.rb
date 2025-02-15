class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from StandardError, with: :internal_server_error

  # ログ出力を追加
  before_action :log_request_details

  private

  def not_found
    render json: { error: 'Resource not found' }, status: :not_found
  end

  def internal_server_error(e)
    Rails.logger.error "Error occurred: #{e.message}\n#{e.backtrace.join("\n")}"
    render json: { error: e.message }, status: :internal_server_error
  end

  def log_request_details
    Rails.logger.info "Request: #{request.method} #{request.url}"
    Rails.logger.info "Parameters: #{params.inspect}"
  end
end