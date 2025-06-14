# システムユーザーを作成するスクリプト
system_user = User.find_or_create_by(email: 'system@bgreviews.com') do |user|
  user.name = 'システム'
  user.provider = 'system'
  user.uid = 'system_user_001'
  user.password = 'SystemPass123!'  # 英大文字・小文字・数字・記号を含む
  user.skip_confirmation!
end

puts "System user created: #{system_user.id} - #{system_user.name} (#{system_user.email})"
puts "System user persisted: #{system_user.persisted?}"
puts "System user errors: #{system_user.errors.full_messages}" if system_user.errors.any? 