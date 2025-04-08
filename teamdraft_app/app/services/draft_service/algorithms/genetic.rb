module DraftService
  module Algorithms
    class Genetic < Base
      def initialize(match, weights = {}, draft_client: Clients::EngineApi.new)
        super(match, weights)
        @draft_client = draft_client
      end

      protected

        def validate_prerequisites!
          raise InvalidMatchError unless match.players.count >= 2
        end

        def create_teams
          json_players = match.players.map { |p|
            {
              id: p.id,
              positioning: p.positioning,
              attack: p.attack,
              defense: p.defense,
              stamina: p.stamina
            }
          }

          response = @draft_client.genetic_draft(json_players, weights)

          team_a = match.players.where(id: response["team_a"].map { |p| p["id"] })
          team_b = match.players.where(id: response["team_b"].map { |p| p["id"] })
          score = response["balance_score"]

          { team_a: team_a, team_b: team_b, score: score }
        end
    end
  end
end
