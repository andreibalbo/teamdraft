class Membership < ApplicationRecord
  belongs_to :user
  belongs_to :group

  validates :role, presence: true, inclusion: { in: %w[admin member] }
  validates :user_id, uniqueness: { scope: :group_id }
end
