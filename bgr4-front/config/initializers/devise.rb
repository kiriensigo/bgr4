Devise.setup do |config|
  # ... 他の設定 ...

  config.jwt do |jwt|
    jwt.secret = Rails.application.credentials.fetch(:secret_key_base)
    jwt.dispatch_requests = [
      ['POST', %r{^/login$}]
    ]
    jwt.revocation_requests = [
      ['DELETE', %r{^/logout$}]
    ]
    jwt.expiration_time = 1.day.to_i
  end
end

