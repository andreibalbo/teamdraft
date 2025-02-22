class Group < ApplicationRecord
  has_many :memberships, dependent: :destroy
  has_many :users, through: :memberships

  has_many :players, dependent: :destroy

  validates :name, presence: true
  validates :category, inclusion: { in: %w[society soccer indoor] }
end
