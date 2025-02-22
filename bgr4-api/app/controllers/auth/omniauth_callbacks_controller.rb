module Auth
  class OmniauthCallbacksController < DeviseTokenAuth::OmniauthCallbacksController
    include ActionController::MimeResponds
    include DeviseTokenAuth::Concerns::SetUserByToken
    include ActionController::Cookies

    before_action :skip_session

    def redirect_callbacks
      Rails.logger.info "redirect_callbacks called"
      super
    end

    def omniauth_success
      Rails.logger.info "omniauth_success started"
      Rails.logger.info "Auth hash: #{auth_hash.inspect}"

      get_resource_from_auth_hash
      Rails.logger.info "Resource after get_resource_from_auth_hash: #{@resource.inspect}"

      if resource_class.devise_modules.include?(:confirmable)
        @resource.skip_confirmation!
        Rails.logger.info "Confirmation skipped"
      end

      # トークン情報の生成
      @client_id = SecureRandom.urlsafe_base64(nil, false)
      @token = SecureRandom.urlsafe_base64(nil, false)
      @expiry = (Time.now + DeviseTokenAuth.token_lifespan).to_i

      # トークンをリソースに保存
      @resource.tokens[@client_id] = {
        token: BCrypt::Password.create(@token),
        expiry: @expiry
      }

      sign_in(:user, @resource, store: false, bypass: false)
      Rails.logger.info "User signed in"

      @resource.save!
      Rails.logger.info "Resource saved with tokens"
      Rails.logger.info "Token info: client_id=#{@client_id}, expiry=#{@expiry}"

      frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:3001'
      
      # クエリパラメータの設定
      query_params = {
        'access-token': @token,
        uid: @resource.uid,
        client: @client_id,
        expiry: @expiry
      }
      
      Rails.logger.info "Token params: #{query_params.inspect}"
      
      redirect_url = "#{frontend_url}/auth/callback?#{query_params.to_query}"
      Rails.logger.info "Redirecting to: #{redirect_url}"
      redirect_to redirect_url

    rescue StandardError => e
      Rails.logger.error "OAuth Error: #{e.class.name} - #{e.message}"
      Rails.logger.error "Backtrace:\n#{e.backtrace.join("\n")}"
      Rails.logger.error "Auth hash: #{auth_hash.inspect}" if defined?(auth_hash)
      Rails.logger.error "Resource: #{@resource.inspect}" if defined?(@resource)
      Rails.logger.error "Token info: client_id=#{@client_id}, expiry=#{@expiry}" if defined?(@client_id)
      Rails.logger.error "Validation errors: #{@resource.errors.full_messages}" if defined?(@resource) && @resource&.errors&.any?
      
      frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:3001'
      error_message = "認証エラー: #{e.message}"
      redirect_to "#{frontend_url}/login?error=#{CGI.escape(error_message)}"
    end

    def omniauth_failure
      Rails.logger.error "OAuth failure: #{params.inspect}"
      frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:3001'
      error_message = params[:message] || '認証に失敗しました'
      redirect_to "#{frontend_url}/login?error=#{CGI.escape(error_message)}"
    end
    
    protected

    def resource_class
      User
    end

    def get_resource_from_auth_hash
      @resource = resource_class.where({
        uid:      auth_hash['uid'],
        provider: auth_hash['provider']
      }).first_or_initialize

      if @resource.new_record?
        @oauth_registration = true
        set_random_password
      end

      assign_provider_attrs(@resource, auth_hash)
      @resource
    end

    def assign_provider_attrs(user, auth_hash)
      user.assign_attributes({
        email: auth_hash['info']['email'],
        name: auth_hash['info']['name']
      })
    end

    def set_random_password
      @resource.password = Devise.friendly_token[0, 20]
      @resource.password_confirmation = @resource.password
    end

    def auth_hash
      request.env['omniauth.auth']
    end

    private

    def skip_session
      request.session_options[:skip] = true
    end
  end
end 