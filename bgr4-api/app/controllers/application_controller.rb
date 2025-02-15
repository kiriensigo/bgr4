class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from StandardError, with: :internal_server_error

  # ログ出力を追加
  before_action :log_request_details

  def authenticate_user!
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end

  def current_user
    return nil unless request.headers['Authorization']
    
    token = request.headers['Authorization'].split(' ').last
    begin
      decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base, true, algorithm: 'HS256')
      User.find(decoded_token[0]['user_id'])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      nil
    end
  end

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