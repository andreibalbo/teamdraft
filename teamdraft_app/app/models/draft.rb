class Draft < ApplicationRecord
  include StatsCalculatable

  belongs_to :match

  validates :balance_score, presence: true, numericality: true
  validate :teams_must_be_from_match_players
  validate :players_must_be_in_only_one_team
  validate :weights_must_be_valid

  def team_a_players
    Player.where(id: team_a_player_ids).order(:positioning)
  end

  def team_b_players
    Player.where(id: team_b_player_ids).order(:positioning)
  end

  def team_a_stats
    calculate_team_stats(team_a_players)
  end

  def team_b_stats
    calculate_team_stats(team_b_players)
  end

  def team_stats_difference
    calculate_stats_difference(team_a_stats, team_b_stats)
  end

  private

    def teams_must_be_from_match_players
      return unless match

      all_draft_players = team_a_player_ids + team_b_player_ids
      unless all_draft_players.all? { |id| match.player_ids.include?(id) }
        errors.add(:base, "All players must be from the match")
      end
    end

    def players_must_be_in_only_one_team
      duplicate_players = team_a_player_ids & team_b_player_ids
      if duplicate_players.any?
        errors.add(:base, "Players cannot be in both teams")
      end
    end

    def weights_must_be_valid
      return unless weights

      if weights.keys.sort != [ "positioning", "attack", "defense", "stamina" ].sort
        errors.add(:base, "Weights must be a valid set of weights")
      end

      if weights.values.any? { |value| value.blank? || !value.is_a?(Numeric) || value < 0 }
        errors.add(:base, "Weights must be valid numbers")
      end
    end
end
