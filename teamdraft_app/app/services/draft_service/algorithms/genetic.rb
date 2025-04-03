module DraftService
  module Algorithms
    class Genetic < Base
      def generate
        json_players = match.players.map { |p|
          {
            id: p.id,
            positioning: p.positioning,
            attack: p.attack,
            defense: p.defense,
            stamina: p.stamina
          }
        }

        response = Clients::EngineApi.new.genetic_draft(json_players, weights)

        match.drafts.build(
          team_a_player_ids: (response["team_a"] || []).map { |p| p["id"] },
          team_b_player_ids: (response["team_b"] || []).map { |p| p["id"] },
          balance_score: response["balance_score"],
          weights: weights
        )
      end
    end
  end
end
