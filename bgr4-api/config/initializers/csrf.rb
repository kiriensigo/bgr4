Rails.application.config.middleware.use ActionDispatch::Cookies
Rails.application.config.middleware.use ActionDispatch::Session::CookieStore

Rails.application.config.action_controller.allow_forgery_protection = true
Rails.application.config.action_controller.forgery_protection_origin_check = true 