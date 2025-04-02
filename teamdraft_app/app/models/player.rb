class Player < ApplicationRecord
  POSITION_RANGES = {
    defensive: 0..35,
    midfield: 36..65,
    attacking: 66..100
  }

  belongs_to :group
  has_many :participations, dependent: :destroy
  has_many :matches, through: :participations

  validates :name, presence: true
  validates :positioning, :defense, :attack, :stamina,
    presence: true,
    numericality: {
      only_integer: true,
      greater_than_or_equal_to: 0,
      less_than_or_equal_to: 100
    }

  def position
    POSITION_RANGES.find { |_, range| range.include?(positioning) }&.first || :unknown
  end

  def slim_position
    position.slice(0, 3).upcase
  end
end
