module MatchService
  class Details
    def initialize(match_id:, user:)
      @match_id = match_id
      @current_user = user
    end

    def call
      match = Match.find_by(id: @match_id)
      return { success: false, error: "Match not found" } unless match

      group = @current_user.groups.find_by(id: match.group_id)
      return { success: false, error: "Access denied" } unless group

      {
        success: true,
        match: match,
        group: group
      }
    end
  end
end
