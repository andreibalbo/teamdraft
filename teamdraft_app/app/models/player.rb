class Player < ApplicationRecord
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
    return "Defensive" if positioning <= 35

    return "Midfield" if positioning <= 65

    "Attacking"
  end

  def slim_position
    return "DEF" if positioning <= 35

    return "MID" if positioning <= 65

    "ATT"
  end
end
