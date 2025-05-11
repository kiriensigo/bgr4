require_relative "boot"

require "rails"

# データベースが無効化されている場合は適切なモジュールを選択的に読み込む
if ENV['DISABLE_DATABASE_CONNECTION'] == 'true'
  puts "\n========================================================================"
  puts "🚫 データベース無効モードで起動中：ActiveRecordを最小限モードで読み込みます"
  puts "========================================================================"
  
  # ActiveRecord以外のRailsコンポーネントを読み込む
  %w(
    action_controller/railtie
    action_view/railtie
    action_mailer/railtie
    active_job/railtie
    action_cable/engine
    active_storage/engine
    active_record/railtie
  ).each do |railtie|
    begin
      require railtie
      puts "✅ #{railtie} を読み込みました"
    rescue LoadError => e
      puts "⚠️ #{railtie} の読み込みをスキップ: #{e.message}"
    end
  end
  
  puts "✅ 最小限モードでRailsフレームワークを初期化します"
else
  # 通常のRailsコンポーネントをすべて読み込む
  puts "📊 通常モード：すべてのRailsコンポーネントを読み込みます"
  require "rails/all"
end

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Bgr4Api
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.0

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w(assets tasks))

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # デフォルトのロケールを日本語に設定
    config.i18n.default_locale = :ja
    config.i18n.load_path += Dir[Rails.root.join('config', 'locales', '**', '*.{rb,yml}').to_s]
    # 利用可能なロケールを設定
    config.i18n.available_locales = [:ja, :en]
    # タイムゾーンを日本に設定
    config.time_zone = 'Tokyo'

    # DB無効モードの場合はActiveRecordのタイムゾーン設定をスキップ
    unless ENV['DISABLE_DATABASE_CONNECTION'] == 'true'
      # Active Recordのタイムゾーンを設定
      config.active_record.default_timezone = :local
    end

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true

    # APIモードでもセッションを使用可能にする
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore
    
    # セッションの設定
    config.session_store :cookie_store, 
      key: '_bgr4_api_session',
      secure: Rails.env.production?,
      httponly: true,
      same_site: :lax

    # データベース接続が無効化されている場合の設定
    if ENV['DISABLE_DATABASE_CONNECTION'] == 'true'
      puts "🔄 データベース無効モードでアプリケーションを設定中..."
      
      # ミドルウェアの調整
      initializer "disable_active_record_middleware", after: :load_config_initializers do
        if defined?(ActiveRecord::Migration::CheckPending)
          config.app_middleware.delete(ActiveRecord::Migration::CheckPending)
          puts "✅ ActiveRecord::Migration::CheckPending ミドルウェアを無効化しました"
        end
        puts "✅ ActiveRecord関連のミドルウェアを無効化しました"
      end
      
      # 軽量なHealthチェックエンドポイントを追加
      initializer "add_health_check_endpoint", after: :load_config_initializers do |app|
        app.routes.append do
          get "/health" => proc { [200, {"Content-Type" => "application/json"}, ["{\"status\":\"ok\",\"mode\":\"database_disabled\"}"]] }
          root to: proc { [200, {"Content-Type" => "application/json"}, ["{\"status\":\"ok\",\"api\":\"bgr4-api\",\"mode\":\"database_disabled\"}"]] }
        end
        puts "✅ ヘルスチェックエンドポイントを追加しました"
      end
      
      # スタンバイメッセージ
      config.after_initialize do
        puts "✓ データベース無効モードでの初期化が完了しました"
        puts "🌐 軽量APIモードの準備完了。データベース関連の操作は無効化または最小限の機能のみ有効です。"
        puts "========================================================================"
      end
    end
  end
end
