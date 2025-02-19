class Group < ApplicationRecord
  validates :name, presence: true
  validates :category, inclusion: { in: %w[society soccer indoor] }
end
