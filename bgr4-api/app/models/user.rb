class User < ApplicationRecord
  # Include devise_token_auth functionality
  include DeviseTokenAuth::Concerns::User
  
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :omniauthable, omniauth_providers: [:google_oauth2, :twitter]
  has_many :reviews

  validates :name, presence: true
  validates :email, presence: true, 
                   uniqueness: { case_sensitive: false },
                   format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, 
                      length: { minimum: 8 },
                      format: { with: /\A(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/,
                               message: 'は英大文字・小文字・数字をそれぞれ1文字以上含む必要があります' },
                      if: -> { new_record? || changes[:encrypted_password] }

  before_save :downcase_email

  def self.from_omniauth(auth)
    user = find_or_initialize_by(provider: auth.provider, uid: auth.uid)
    
    # パスワードがない場合は生成
    user.password = SecureRandom.urlsafe_base64 if user.new_record?
    
    user.assign_attributes({
      name: auth.info.name,
      email: auth.info.email || "#{auth.uid}@twitter.example.com",
      avatar_url: auth.info.image
    })

    # バリデーションをスキップしてセーブ
    user.save(validate: false)
    user
  end

  private

  def downcase_email
    self.email = email.downcase
  end
end
