class Participation < ApplicationRecord
  belongs_to :player
  belongs_to :match

  validates :player_id, uniqueness: { scope: :match_id }
  validate :player_belongs_to_match_group

  private

    def player_belongs_to_match_group
      return unless player && match

      unless player.group_id == match.group_id
        errors.add(:player, "must belong to the same group as the match")
      end
    end
end
