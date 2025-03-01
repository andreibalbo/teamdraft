class Draft < ApplicationRecord
  belongs_to :match

  validates :balance_score, presence: true, numericality: true
  validate :teams_must_be_from_match_players
  validate :players_must_be_in_only_one_team

  def team_a_players
    Player.where(id: team_a_player_ids)
  end

  def team_b_players
    Player.where(id: team_b_player_ids)
  end

  def team_a_stats
    calculate_team_stats(team_a_players)
  end

  def team_b_stats
    calculate_team_stats(team_b_players)
  end

  def team_stats_difference
    a_stats = team_a_stats
    b_stats = team_b_stats

    {
      attack: (a_stats[:attack] - b_stats[:attack]).abs,
      defense: (a_stats[:defense] - b_stats[:defense]).abs,
      stamina: (a_stats[:stamina] - b_stats[:stamina]).abs,
      positioning: (a_stats[:positioning] - b_stats[:positioning]).abs
    }
  end

  private

    def calculate_team_stats(players)
      {
        attack: players.sum(&:attack),
        defense: players.sum(&:defense),
        stamina: players.sum(&:stamina),
        positioning: players.sum(&:positioning)
      }
    end

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
end
