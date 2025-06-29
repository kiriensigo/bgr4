# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # ローカル開発環境
    origins 'http://localhost:3001', 'http://127.0.0.1:3001'
    
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: ['access-token', 'expiry', 'token-type', 'uid', 'client']
  end

  allow do
    # Render本番環境
    origins 'https://bgr4-reviews.onrender.com', 
            /https:\/\/bgr4-front-.*\.onrender\.com/,
            ENV['FRONTEND_URL']&.presence
    
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: ['access-token', 'expiry', 'token-type', 'uid', 'client']
  end

  # プリフライトリクエスト対応
  allow do
    origins '*'
    resource '/api/v1/health',
      headers: :any,
      methods: [:get, :options, :head],
      credentials: false
  end
end

# セキュリティヘッダー設定
Rails.application.config.force_ssl = Rails.env.production?

# セッション設定
Rails.application.config.session_store :cookie_store, 
  key: '_bgr4_session',
  secure: Rails.env.production?,
  httponly: true,
  same_site: :lax
