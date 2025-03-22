module Clients
  class EngineApi
    def initialize
    end

    def generate_teams(players)
      response = HTTParty.post("http://engine:5000/generate_teams",
        body: { players: players }.to_json,
        headers: { "Content-Type" => "application/json" }
      )

      JSON.parse(response.body)
    end
  end
end
