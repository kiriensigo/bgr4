module Auth
  class OmniauthCallbacksController < ApplicationController
    skip_before_action :verify_authenticity_token, raise: false

    def passthru
      render status: 404, plain: "Not Found"
    end

    def callback
      # プロバイダーからのコールバックの場合
      if request.env['omniauth.auth'].present?
        auth = request.env['omniauth.auth']
        
        begin
          user = User.from_omniauth(auth)
          
          if user.persisted?
            token = JWT.encode(
              { user_id: user.id, exp: 24.hours.from_now.to_i },
              Rails.application.credentials.secret_key_base,
              'HS256'
            )
            
            # フロントエンドのURLが設定されていない場合のフォールバック
            frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:3001'
            redirect_to "#{frontend_url}/auth/callback?token=#{token}"
          else
            redirect_to "#{frontend_url}/signin?error=#{CGI.escape('認証に失敗しました')}"
          end
        rescue => e
          Rails.logger.error "Authentication error: #{e.message}"
          redirect_to "#{frontend_url}/signin?error=#{CGI.escape('認証処理中にエラーが発生しました')}"
        end
      else
        # トークンパラメータがある場合は不正なリクエストとして扱う
        render status: 400, json: { error: '不正なリクエストです' }
      end
    end

    def failure
      Rails.logger.error "Auth failure: #{params.inspect}"
      Rails.logger.error "Error message: #{params[:message]}"
      Rails.logger.error "Error strategy: #{params[:strategy]}"
      frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:3001'
      redirect_to "#{frontend_url}/signin?error=#{CGI.escape('認証に失敗しました')}"
    end

    private

    def frontend_url
      ENV['FRONTEND_URL'] || 'http://localhost:3001'
    end
  end
end 