module Auth
  class OmniauthCallbacksController < DeviseTokenAuth::OmniauthCallbacksController
    include ActionController::MimeResponds
    include DeviseTokenAuth::Concerns::SetUserByToken
    include ActionController::Cookies
    include ActionController::RequestForgeryProtection

    protect_from_forgery with: :null_session
    before_action :skip_session

    def passthru
      Rails.logger.info "Passthru action called for provider: #{params[:provider]}"
      render status: 404, json: { errors: ["Not found. Authentication passthru."]}
    end

    def omniauth_success
      Rails.logger.info "omniauth_success started"
      Rails.logger.info "Auth hash: #{auth_hash.inspect}"

      get_resource
      
      if @resource.new_record?
        @oauth_registration = true
        set_random_password
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

      if resource_class.devise_modules.include?(:confirmable)
        @resource.skip_confirmation!
      end

      if @resource.save
        Rails.logger.info "User saved successfully"
        
        # レスポンスヘッダーにトークン情報を設定
        response.headers.merge!({
          'access-token' => @token,
          'client' => @client_id,
          'uid' => @resource.uid,
          'expiry' => @expiry.to_s,
          'token-type' => 'Bearer'
        })

        # クエリパラメータの設定
        query_params = {
          'access-token': @token,
          'client': @client_id,
          'uid': @resource.uid,
          'expiry': @expiry
        }
        
        redirect_url = "#{ENV['FRONTEND_URL']}/auth/callback?#{query_params.to_query}"
        Rails.logger.info "Redirecting to: #{redirect_url}"
        redirect_to redirect_url, allow_other_host: true
      else
        Rails.logger.error "Failed to save user: #{@resource.errors.full_messages}"
        error_message = @resource.errors.full_messages.join(", ")
        redirect_to "#{ENV['FRONTEND_URL']}/login?error=#{CGI.escape(error_message)}", allow_other_host: true
      end
    rescue StandardError => e
      Rails.logger.error "OAuth Error: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      redirect_to "#{ENV['FRONTEND_URL']}/login?error=#{CGI.escape(e.message)}", allow_other_host: true
    end

    def omniauth_failure
      error_msg = params[:message] || env['omniauth.error.type'] || "認証に失敗しました"
      Rails.logger.error "OAuth Failure: #{error_msg}"
      Rails.logger.error "OAuth Error params: #{params.inspect}"
      redirect_to "#{ENV['FRONTEND_URL']}/login?error=#{CGI.escape(error_msg)}", allow_other_host: true
    end

    protected

    def resource_class(mapping = nil)
      User
    end

    def auth_hash
      request.env['omniauth.auth']
    end

    def get_resource
      @resource = resource_class.where({
        email: auth_hash.info.email || "#{auth_hash.uid}@#{auth_hash.provider}.boardgamereview.com",
        provider: auth_hash.provider,
        uid: auth_hash.uid
      }).first_or_initialize

      assign_provider_attrs(@resource, auth_hash)

      @resource
    end

    def assign_provider_attrs(user, auth_hash)
      user.assign_attributes({
        name: auth_hash.info.name,
        image: auth_hash.info.image,
        email: auth_hash.info.email || "#{auth_hash.uid}@#{auth_hash.provider}.boardgamereview.com",
        provider: auth_hash.provider,
        uid: auth_hash.uid
      })
    end

    def set_random_password
      @resource.password = Devise.friendly_token[0, 20]
      @resource.password_confirmation = @resource.password
    end

    private

    def skip_session
      request.session_options[:skip] = true
    end

    def warden
      request.env['warden']
    end
  end
end 