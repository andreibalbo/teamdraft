class Player < ApplicationRecord
  belongs_to :group
  # has_and_belongs_to_many :matches

  validates :name, presence: true
  validates :positioning, :defensive, :offensive, :stamina,
    presence: true,
    numericality: {
      only_integer: true,
      greater_than_or_equal_to: 0,
      less_than_or_equal_to: 100
    }
end
