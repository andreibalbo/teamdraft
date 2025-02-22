module MatchService
  class Update
    def initialize(match_id:, params:, user:)
      @match_id = match_id
      @params = params
      @current_user = user
    end

    def call
      match = Match.find_by(id: @match_id)
      return { success: false, error: "Match not found" } unless match

      group = @current_user.managed_groups.find_by(id: match.group_id)
      return { success: false, error: "Access denied" } unless group

      if match.update(@params)
        {
          success: true,
          match: match,
          group: group
        }
      else
        {
          success: false,
          match: match,
          group: group
        }
      end
    end
  end
end
