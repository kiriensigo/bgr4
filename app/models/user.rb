class User < ApplicationRecord
  has_secure_password
  has_many :reviews

  validates :name, presence: true
  validates :email, presence: true, 
                   uniqueness: { case_sensitive: false },
                   format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, 
                      length: { minimum: 8 },
                      format: { with: /\A(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])/,
                               message: 'は英大文字・小文字・数字をそれぞれ1文字以上含む必要があります' },
                      if: -> { new_record? || changes[:password_digest] }

  before_save :downcase_email

  private

  def downcase_email
    self.email = email.downcase
  end
end 