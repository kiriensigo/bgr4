class ApplicationController < ActionController::API
  include ActionController::Cookies
  include DeviseTokenAuth::Concerns::SetUserByToken

  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :log_request_details

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from StandardError, with: :internal_server_error

  # APIモードでは protect_from_forgery は不要なので削除
  # protect_from_forgery with: :exception を削除
  # skip_before_action :verify_authenticity_token, if: :jwt_auth? を削除

  def authenticate_user!
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end

  def current_user
    # DeviseTokenAuthのcurrent_userを優先的に使用
    super || authenticate_token
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
    Rails.logger.info "Headers: #{request.headers.to_h.select { |k, _| k.start_with?('HTTP_') }}"
    Rails.logger.info "Auth Headers: #{request.headers.to_h.select { |k, _| k.downcase.include?('access-token') || k.downcase.include?('client') || k.downcase.include?('uid') }}"
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name])
  end

  def authenticate_token
    return nil unless request.headers['Authorization']
    
    token = request.headers['Authorization'].split(' ').last
    begin
      decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base, true, algorithm: 'HS256')
      User.find(decoded_token[0]['user_id'])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      nil
    end
  end
end