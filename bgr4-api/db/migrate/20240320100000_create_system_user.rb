class CreateSystemUser < ActiveRecord::Migration[8.0]
  def up
    system_user = User.find_or_create_by!(email: 'system@boardgamereview.com') do |u|
      u.name = 'BoardGameGeek'
      u.password = SecureRandom.hex(16)
      u.uid = u.email
      u.provider = 'email'
      u.confirmed_at = Time.current
    end
    
    puts "System user created: #{system_user.email}"
  end

  def down
    User.find_by(email: 'system@boardgamereview.com')&.destroy
  end
end 