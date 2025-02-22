class Match < ApplicationRecord
  belongs_to :group
  has_many :participations, dependent: :destroy
  has_many :players, through: :participations

  validates :datetime, presence: true
end
