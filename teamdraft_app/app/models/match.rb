class Match < ApplicationRecord
  belongs_to :group
  has_many :participations, dependent: :destroy
  has_many :players, through: :participations
  has_many :drafts, dependent: :destroy

  validates :datetime, presence: true
end
