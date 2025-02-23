require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Bgr4Api
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.1

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
    # 利用可能なロケールを設定
    config.i18n.available_locales = [:ja, :en]
    # タイムゾーンを日本に設定
    config.time_zone = 'Tokyo'
    # Active Recordのタイムゾーンを設定
    config.active_record.default_timezone = :local

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
  end
end
