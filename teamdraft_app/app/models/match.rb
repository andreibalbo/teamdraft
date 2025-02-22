class Match < ApplicationRecord
  belongs_to :group

  validates :datetime, presence: true
end
