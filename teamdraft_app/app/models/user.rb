class User < ApplicationRecord
  has_secure_password

  has_many :memberships, dependent: :destroy
  has_many :groups, through: :memberships

  validates :email, presence: true,
            uniqueness: { case_sensitive: false },
            format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true,
                      length: { minimum: 6 },
                      on: :create
end
