
# app/services/draft_service/algorithms/random.rb
module DraftService
  module Algorithms
    class Random < Base
      ATTEMPTS = 5

      protected

        def validate_prerequisites!
          raise InvalidMatchError unless match.players.count >= 2
        end

        def create_teams
          best_score = 0
          best_teams = nil

          ATTEMPTS.times do
            players = match.players.to_a.shuffle
            mid_point = (players.length / 2.0).ceil

            team_a = players[0...mid_point]
            team_b = players[mid_point..]

            score = score_calculator.calculate_score(team_a, team_b)

            if score > best_score
              best_score = score
              best_teams = { team_a: team_a, team_b: team_b, score: score }
            end
          end

          best_teams
        end
    end
  end
end
