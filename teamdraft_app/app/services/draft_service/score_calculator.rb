# app/services/draft_service/team_balance_calculator.rb
module DraftService
  class ScoreCalculator
    def initialize(weights = {})
      @weights = weights.presence || default_weights
    end

    def calculate_score(team_a, team_b)
      stats = calculate_team_stats(team_a, team_b)
      calculate_weighted_score(stats)
    end

    private

      attr_reader :weights

      def calculate_team_stats(team_a, team_b)
        {
          attack: {
            a: team_a.sum(&:attack),
            b: team_b.sum(&:attack)
          },
          defense: {
            a: team_a.sum(&:defense),
            b: team_b.sum(&:defense)
          },
          stamina: {
            a: team_a.sum(&:stamina),
            b: team_b.sum(&:stamina)
          }
        }
      end

      def calculate_weighted_score(stats)
        differences = stats.map do |attribute, values|
          max_value = [ values[:a], values[:b] ].max.to_f
          difference = (values[:a] - values[:b]).abs / max_value
          [ attribute, difference * weights[attribute] ]
        end.to_h

        1 - (differences.values.sum / weights.values.sum)
      end

      def default_weights
        {
          positioning: 1,
          attack: 1,
          defense: 1,
          stamina: 1
        }
      end
  end
end
