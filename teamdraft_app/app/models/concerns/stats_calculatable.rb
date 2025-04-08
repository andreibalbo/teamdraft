module StatsCalculatable
  extend ActiveSupport::Concern

  def calculate_team_stats(players)
    {
      attack: players.sum(&:attack),
      defense: players.sum(&:defense),
      stamina: players.sum(&:stamina),
      positioning: players.sum(&:positioning)
    }
  end

  def calculate_stats_difference(team_a_stats, team_b_stats)
    {
      attack: (team_a_stats[:attack] - team_b_stats[:attack]).abs,
      defense: (team_a_stats[:defense] - team_b_stats[:defense]).abs,
      stamina: (team_a_stats[:stamina] - team_b_stats[:stamina]).abs,
      positioning: (team_a_stats[:positioning] - team_b_stats[:positioning]).abs
    }
  end
end
