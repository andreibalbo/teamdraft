module DraftService
  module DraftClientInterface
    def genetic_draft(players, weights)
      raise NotImplementedError, "#{self.class} must implement genetic_draft"
    end
  end
end
