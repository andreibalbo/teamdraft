
# app/services/draft_service/algorithms/random.rb
module DraftService
  module Algorithms
    class Random < Base
      ATTEMPTS = 5

      def initialize(match, weights = {})
        super
        @score_calculator = ScoreCalculator.new(weights)
      end

      def generate
        best_score = 0
        best_draft = nil

        ATTEMPTS.times do
          players = match.players.to_a.shuffle
          mid_point = (players.length / 2.0).ceil

          team_a = players[0...mid_point]
          team_b = players[mid_point..]

          score = @score_calculator.calculate_score(team_a, team_b)

          if score > best_score
            best_score = score
            best_draft = build_draft(team_a, team_b, score)
          end
        end

        best_draft
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
