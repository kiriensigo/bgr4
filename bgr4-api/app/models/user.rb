class User < ApplicationRecord
  # Include devise_token_auth functionality
  include DeviseTokenAuth::Concerns::User
  
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :omniauthable, omniauth_providers: [:google_oauth2]
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
  after_initialize :set_default_tokens

  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email = auth.info.email
      user.password = Devise.friendly_token[0, 20]
      user.name = auth.info.name
      user.skip_confirmation!
    end
  end

  private

  def downcase_email
    self.email = email.downcase
  end

  def set_default_tokens
    self.tokens ||= {}
  end
end
