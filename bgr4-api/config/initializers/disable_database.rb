# データベース接続を無効にする設定
Rails.application.config.after_initialize do
  if ENV["DISABLE_DATABASE_CONNECTION"] == "true"
    # nulldbアダプターを使用
    ActiveRecord::Base.establish_connection adapter: "nulldb", schema: "schema.rb"
    puts "Database connection is disabled. Using nulldb adapter."
  end
end 