Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
    ENV['GOOGLE_CLIENT_ID'],
    ENV['GOOGLE_CLIENT_SECRET'],
    {
      callback_url: "#{ENV['API_URL']}/auth/google_oauth2/callback",
      provider_ignores_state: true,
      skip_jwt: true,
      access_type: 'offline',
      prompt: 'select_account',
      scope: 'email,profile',
      path_prefix: '/auth'
    }
end

# CSRFトークンチェックの設定
OmniAuth.config.allowed_request_methods = [:get, :post]
OmniAuth.config.silence_get_warning = true
OmniAuth.config.full_host = ENV['API_URL']

# デバッグログを有効化
OmniAuth.config.logger = Rails.logger

# エラーハンドリングの設定
OmniAuth.config.on_failure = Proc.new do |env|
  Rails.logger.error "OmniAuth Failure: #{env['omniauth.error'].inspect}"
  Rails.logger.error "Error Strategy: #{env['omniauth.error.strategy'].inspect}"
  Rails.logger.error "Error Message: #{env['omniauth.error.message']}"
  
  OmniAuth::FailureEndpoint.new(env).redirect_to_failure
end 