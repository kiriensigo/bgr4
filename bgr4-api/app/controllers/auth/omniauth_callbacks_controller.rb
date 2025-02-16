module Auth
  class OmniauthCallbacksController < ApplicationController
    skip_before_action :verify_authenticity_token, raise: false

    def passthru
      Rails.logger.info "Passthru called for Google auth"
      redirect_to "/auth/google_oauth2"
    end

    def callback
      Rails.logger.info "Callback received with params: #{params.inspect}"
      Rails.logger.info "Request headers: #{request.headers.to_h.select { |k,v| k.start_with?('HTTP_') }.inspect}"
      
      auth = request.env['omniauth.auth']
      Rails.logger.info "Auth data received: #{auth.inspect}"
      
      user = User.from_omniauth(auth)
      Rails.logger.info "User found/created: #{user.inspect}"

      if user.persisted?
        token = JWT.encode(
          { user_id: user.id, exp: 24.hours.from_now.to_i },
          Rails.application.credentials.secret_key_base,
          'HS256'
        )
        
        redirect_url = "#{ENV['FRONTEND_URL']}/auth/callback?token=#{token}"
        Rails.logger.info "Redirecting to: #{redirect_url}"
        redirect_to redirect_url
      else
        Rails.logger.error "User persistence failed: #{user.errors.full_messages}"
        redirect_to "#{ENV['FRONTEND_URL']}/signup?error=#{URI.encode('認証に失敗しました')}"
      end
    end

    def failure
      Rails.logger.error "Auth failure: #{params.inspect}"
      Rails.logger.error "Error message: #{params[:message]}"
      Rails.logger.error "Error strategy: #{params[:strategy]}"
      redirect_to "#{ENV['FRONTEND_URL']}/login?error=#{URI.encode('認証に失敗しました')}"
    end
  end
end 