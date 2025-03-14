class Draft < ApplicationRecord
  belongs_to :match

  validates :balance_score, presence: true, numericality: true
  validate :teams_must_be_from_match_players
  validate :players_must_be_in_only_one_team

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
    a_stats = team_a_stats
    b_stats = team_b_stats

    {
      attack: (a_stats[:attack] - b_stats[:attack]).abs,
      defense: (a_stats[:defense] - b_stats[:defense]).abs,
      stamina: (a_stats[:stamina] - b_stats[:stamina]).abs,
      positioning: (a_stats[:positioning] - b_stats[:positioning]).abs
    }
  end

  def divide_team_players(players)
    return [ [], [], [] ] if players.nil? || players.empty?

    sorted_players = players.sort_by(&:positioning)
    total = players.length

    if total <= 4
      # For 4 or fewer players, split between defense and attack
      mid_point = (total / 2.0).ceil  # Round up to put extra player in defense
      [
        sorted_players[0...mid_point],  # Defense gets extra player if odd
        [],                             # No midfield
        sorted_players[mid_point..-1]   # Attack
      ]
    else
      # For 5+ players, divide into three sectors
      base_size = total / 3            # How many players per sector without remainder
      remainder = total % 3            # How many players are left over

      # Calculate final sizes for each sector
      def_size = base_size + (remainder > 0 ? 1 : 0)     # Defense gets first extra
      mid_size = base_size + (remainder > 1 ? 1 : 0)     # Midfield gets second extra
      att_size = base_size                               # Attack gets base size

      current_index = 0
      [
        sorted_players[current_index...(current_index += def_size)],
        sorted_players[current_index...(current_index += mid_size)],
        sorted_players[current_index..-1]
      ]
    end
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
