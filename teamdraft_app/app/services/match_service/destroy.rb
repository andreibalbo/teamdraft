module MatchService
  class Destroy
    def initialize(match_id:, user:)
      @match_id = match_id
      @current_user = user
    end

    def call
      match = Match.find_by(id: @match_id)
      return { success: false, error: "Match not found" } unless match

      group = @current_user.managed_groups.find_by(id: match.group_id)
      return { success: false, error: "Access denied" } unless group

      if match.destroy
        {
          success: true,
          group: group
        }
      else
        {
          success: false,
          error: "Failed to delete match",
          group: group
        }
      end
    end
  end
end
