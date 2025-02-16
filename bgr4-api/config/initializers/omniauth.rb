Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
    ENV['GOOGLE_CLIENT_ID'],
    ENV['GOOGLE_CLIENT_SECRET'],
    {
      scope: 'email,profile',
      prompt: 'select_account',
      callback_url: "http://localhost:3000/auth/google_oauth2/callback",
      provider_ignores_state: true
    }

  provider :twitter2,
    ENV['TWITTER_CLIENT_ID'],
    ENV['TWITTER_CLIENT_SECRET'],
    {
      callback_url: "#{ENV['API_URL']}/auth/twitter/callback"
    }
end

# CSRFトークンチェックを無効化（APIモードの場合）
OmniAuth.config.allowed_request_methods = [:get, :post]
OmniAuth.config.silence_get_warning = true

# コールバックフェーズの前の処理を修正
OmniAuth.config.before_callback_phase do |env|
  request = Rack::Request.new(env)
  
  # Googleからのコールバックの場合はチェックをスキップ
  next if request.params['provider'] == 'google_oauth2' || 
          request.path.include?('google_oauth2')
  
  allowed_hosts = ['http://localhost:3000', 'http://localhost:3001']
  unless allowed_hosts.include?(request.referer&.split('?')&.first)
    raise OmniAuth::Error, "Callback URL not allowed"
  end
end 