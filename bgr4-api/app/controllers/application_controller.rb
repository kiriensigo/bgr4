class ApplicationController < ActionController::API
  include ActionController::Cookies
  include DeviseTokenAuth::Concerns::SetUserByToken

  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :log_request_details

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from StandardError, with: :internal_server_error

  def authenticate_user!
    auth_headers = request.headers.to_h.select { |k, _| k.downcase.include?('access-token') || k.downcase.include?('client') || k.downcase.include?('uid') }
    Rails.logger.info "Authenticating with headers: #{auth_headers}"
    
    unless current_user
      Rails.logger.error "Authentication failed: No current user"
      render json: { error: '認証が必要です' }, status: :unauthorized
      return
    end
    
    Rails.logger.info "Authentication successful for user: #{current_user.email}"
    true
  end

  def current_user
    @current_user ||= begin
      auth_headers = request.headers.to_h.select { |k, _| k.downcase.include?('access-token') || k.downcase.include?('client') || k.downcase.include?('uid') }
      user = User.find_by(uid: auth_headers['HTTP_UID'])
      
      if user && valid_token?(auth_headers['HTTP_ACCESS_TOKEN'], user)
        user
      else
        nil
      end
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
    Rails.logger.info "Headers: #{request.headers.to_h.select { |k, _| k.start_with?('HTTP_') }}"
    Rails.logger.info "Auth Headers: #{request.headers.to_h.select { |k, _| k.downcase.include?('access-token') || k.downcase.include?('client') || k.downcase.include?('uid') }}"
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name])
  end

  def valid_token?(token, user)
    return false unless token && user
    
    begin
      decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base, true, algorithm: 'HS256')
      decoded_token[0]['user_id'] == user.id
    rescue JWT::DecodeError
      false
    end
  end
end