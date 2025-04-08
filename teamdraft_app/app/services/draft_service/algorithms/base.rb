module DraftService
  module Algorithms
    class Base
      def initialize(match, weights = {})
        @match = match
        @weights = weights
        @score_calculator = ScoreCalculator.new(weights)
      end

      def generate
        validate_prerequisites!
        teams = create_teams
        build_draft(teams[:team_a], teams[:team_b], teams[:score])
      end

      protected

        attr_reader :match, :weights, :score_calculator

        def validate_prerequisites!
          raise NotImplementedError, "#{self.class} must implement validate_prerequisites!"
        end

        def create_teams
          raise NotImplementedError, "#{self.class} must implement create_teams!"
        end

      private

        def build_draft(team_a, team_b, score)
          match.drafts.build(
            team_a_player_ids: team_a.map(&:id),
            team_b_player_ids: team_b.map(&:id),
            balance_score: score,
            weights: weights
          )
        end
    end
  end
end
