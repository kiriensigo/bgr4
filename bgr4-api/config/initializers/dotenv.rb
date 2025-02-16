# バックエンド側の設定
Rails.application.config.before_configuration do
  if Rails.env.development? || Rails.env.test?
    require 'dotenv'
    Dotenv.load(
      '.env',
      '.env.local',
      ".env.#{Rails.env}",
    )
  end
end 