module DraftService
  class Generate
    def initialize(match_id:, user:, algorithm: "genetic", weights: {})
      @match_id = match_id
      @current_user = user
      @algorithm = algorithm
      @weights = weights
    end

    def call
      match = Match.find_by(id: @match_id)
      return { success: false, error: "Match not found" } unless match

      group = @current_user.managed_groups.find_by(id: match.group_id)
      return { success: false, error: "Access denied" } unless group

      algorithm_processor = AlgorithmFactory.for(@algorithm, match, @weights)
      best_draft = algorithm_processor.generate

      if best_draft.save
        {
          success: true,
          match: match,
          draft: best_draft,
          group: group
        }
      else
        {
          success: false,
          error: "Failed to create draft",
          match: match,
          group: group
        }
      end
    end
  end
end
