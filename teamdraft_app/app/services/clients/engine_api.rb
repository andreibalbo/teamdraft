module Clients
  class EngineApi
    include DraftService::DraftClientInterface

    def initialize
      @base_url = "http://engine:5000"
    end

    def genetic_draft(players, weights)
      response = HTTParty.post("#{@base_url}/genetic_draft",
        body: { players: players, weights: weights }.to_json,
        headers: { "Content-Type" => "application/json" }
      )

      JSON.parse(response.body)
    end
  end
end
