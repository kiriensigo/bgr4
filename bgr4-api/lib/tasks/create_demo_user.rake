namespace :demo do
  desc "Create demo user account"
  task create_user: :environment do
    email = 'demo@example.com'
    
    # Check if demo user already exists
    existing_user = User.find_by(email: email)
    if existing_user
      puts "Demo user already exists with ID: #{existing_user.id}"
      puts "Email: #{existing_user.email}"
      puts "Name: #{existing_user.name}"
      return
    end
    
    # Create demo user
    user = User.new(
      email: email,
      password: 'Demo2025',
      password_confirmation: 'Demo2025',
      name: 'Demo User',
      bio: 'このアカウントはデモ用です。自由にお試しください。',
      uid: email
    )
    
    # Skip email confirmation for demo user
    user.skip_confirmation!
    
    if user.save
      puts 'Demo user created successfully!'
      puts "Email: #{user.email}"
      puts "Name: #{user.name}"
      puts "ID: #{user.id}"
      puts "Bio: #{user.bio}"
      puts "Confirmed: #{user.confirmed?}"
    else
      puts 'Failed to create demo user:'
      puts user.errors.full_messages
    end
  end
  
  desc "Show demo user info"
  task show_user: :environment do
    user = User.find_by(email: 'demo@example.com')
    if user
      puts 'Demo user found:'
      puts "  ID: #{user.id}"
      puts "  Email: #{user.email}"
      puts "  Name: #{user.name}"
      puts "  Confirmed: #{user.confirmed?}"
      puts "  Admin: #{user.admin?}"
      puts "  Bio: #{user.bio}"
      puts "  Reviews count: #{user.reviews.count}"
      puts "  Created at: #{user.created_at}"
    else
      puts 'Demo user not found!'
    end
  end
  
  desc "Delete demo user"
  task delete_user: :environment do
    user = User.find_by(email: 'demo@example.com')
    if user
      user.destroy
      puts 'Demo user deleted successfully!'
    else
      puts 'Demo user not found!'
    end
  end
end