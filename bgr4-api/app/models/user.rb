class User < ApplicationRecord
  # Include devise_token_auth functionality
  include DeviseTokenAuth::Concerns::User
  
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :omniauthable, omniauth_providers: [:google_oauth2, :twitter2]
  has_many :reviews
  has_many :game_edit_histories
  has_many :wishlist_items, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, 
                   uniqueness: { case_sensitive: false },
                   format: { with: URI::MailTo::EMAIL_REGEXP },
                   unless: :oauth_login?
  validates :password, presence: true, 
                      length: { minimum: 8 },
                      format: { with: /\A(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/,
                               message: 'は英大文字・小文字・数字をそれぞれ1文字以上含む必要があります' },
                      if: :password_required?

  before_save :downcase_email
  after_initialize :set_default_tokens

  def password_required?
    return false if provider.present?
    new_record? || changes[:encrypted_password].present?
  end

  def oauth_login?
    provider.present? && uid.present?
  end

  def admin?
    # 管理者フラグがある場合はそれを使用
    return is_admin if respond_to?(:is_admin)
    
    # 特定のメールアドレスを持つユーザーを管理者とする
    email.present? && (
      email.end_with?('@boardgamereview.com') || 
      email == 'admin@example.com'
    )
  end

  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email = if auth.info.email.present?
                    auth.info.email
                  else
                    "#{auth.uid}@#{auth.provider}.boardgamereview.com"
                  end
      user.password = Devise.friendly_token[0, 20]
      user.name = auth.info.name
      user.image = auth.info.image if auth.info.image.present?
      user.skip_confirmation!
    end
  end

  private

  def downcase_email
    self.email = email.downcase if email.present?
  end

  def set_default_tokens
    self.tokens ||= {}
  end
end
