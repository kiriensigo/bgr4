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

  provider :twitter2,
    ENV['TWITTER_CLIENT_ID'],
    ENV['TWITTER_CLIENT_SECRET'],
    {
      callback_url: "#{ENV['API_URL']}/auth/twitter2/callback",
      client_options: {
        authorize_url: 'https://twitter.com/i/oauth2/authorize',
        token_url: 'https://api.twitter.com/2/oauth2/token'
      },
      provider_ignores_state: true,
      scope: 'users.read tweet.read offline.access',
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