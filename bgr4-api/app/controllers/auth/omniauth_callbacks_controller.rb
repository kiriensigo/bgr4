module Auth
  class OmniauthCallbacksController < DeviseTokenAuth::OmniauthCallbacksController
    include ActionController::MimeResponds
    include DeviseTokenAuth::Concerns::SetUserByToken
    include ActionController::Cookies
    include ActionController::RequestForgeryProtection

    protect_from_forgery with: :null_session
    before_action :skip_session

    def omniauth_success
      Rails.logger.info "omniauth_success started"
      Rails.logger.info "Auth hash: #{auth_hash.inspect}"

      begin
        # 既存のユーザーを検索
        @resource = User.find_by(email: auth_hash['info']['email'])

        if @resource
          # 既存のユーザーが見つかった場合
          Rails.logger.info "Existing user found: #{@resource.inspect}"
          
          # プロバイダー情報を更新
          @resource.update!(
            provider: auth_hash['provider'],
            uid: auth_hash['uid']
          )
        else
          # 新規ユーザーの作成
          Rails.logger.info "Creating new user"
          @resource = User.new(
            email: auth_hash['info']['email'],
            name: auth_hash['info']['name'],
            provider: auth_hash['provider'],
            uid: auth_hash['uid'],
            password: Devise.friendly_token[0, 20]
          )
          @resource.skip_confirmation!
          @resource.save!
        end

        Rails.logger.info "User saved successfully: #{@resource.inspect}"

        # 既存のトークンをクリア
        @resource.tokens = {}
        
        # トークン情報の生成
        @client_id = SecureRandom.urlsafe_base64(nil, false)
        @token = SecureRandom.urlsafe_base64(nil, false)
        @expiry = (Time.now + DeviseTokenAuth.token_lifespan).to_i

        # トークンをリソースに保存
        @resource.tokens[@client_id] = {
          token: BCrypt::Password.create(@token),
          expiry: @expiry
        }

        # 保存を確実に行う
        if @resource.save
          Rails.logger.info "Resource saved with tokens"
          Rails.logger.info "Token info: client_id=#{@client_id}, expiry=#{@expiry}"

          # レスポンスヘッダーにトークン情報を設定
          response.headers.merge!({
            'access-token' => @token,
            'client' => @client_id,
            'uid' => @resource.uid,
            'expiry' => @expiry.to_s,
            'token-type' => 'Bearer'
          })

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
        else
          Rails.logger.error "Failed to save resource: #{@resource.errors.full_messages}"
          error_message = "ユーザー情報の保存に失敗しました"
          redirect_to "#{frontend_url}/login?error=#{CGI.escape(error_message)}"
        end

      rescue StandardError => e
        Rails.logger.error "OAuth Error: #{e.class.name} - #{e.message}"
        Rails.logger.error "Backtrace:\n#{e.backtrace.join("\n")}"
        Rails.logger.error "Auth hash: #{auth_hash.inspect}"
        Rails.logger.error "Resource: #{@resource.inspect}" if defined?(@resource)
        Rails.logger.error "Token info: client_id=#{@client_id}, expiry=#{@expiry}" if defined?(@client_id)
        Rails.logger.error "Validation errors: #{@resource.errors.full_messages}" if defined?(@resource) && @resource&.errors&.any?
        
        frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:3001'
        error_message = "認証エラー: #{e.message}"
        redirect_to "#{frontend_url}/login?error=#{CGI.escape(error_message)}"
      end
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

    def auth_hash
      request.env['omniauth.auth']
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