namespace :system_user do
  desc "システムユーザーが存在するか確認し、存在しない場合は作成する"
  task ensure_exists: :environment do
    system_email = 'system@boardgamereview.com'
    
    if User.exists?(email: system_email)
      puts "システムユーザーは既に存在します: #{system_email}"
    else
      # システムユーザーを作成
      password = SecureRandom.hex(16)
      user = User.new(
        email: system_email,
        name: 'システム',
        password: password,
        password_confirmation: password
      )
      
      if user.save
        puts "システムユーザーを作成しました: #{system_email}"
      else
        puts "システムユーザーの作成に失敗しました: #{user.errors.full_messages.join(', ')}"
      end
    end
  end
end 