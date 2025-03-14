module DraftService
  class Details
    def initialize(draft_id:, user:)
      @draft_id = draft_id
      @current_user = user
    end

    def call
      draft = Draft.find_by(id: @draft_id)
      return { success: false, error: "Draft not found" } unless draft

      match = draft.match
      group = @current_user.managed_groups.find_by(id: match.group_id)
      return { success: false, error: "Access denied" } unless group

      line_up_a = LineUp.new(players: draft.team_a_players).call
      line_up_b = LineUp.new(players: draft.team_b_players).call

      {
        success: true,
        draft: draft,
        match: match,
        group: group,
        line_up_a: line_up_a,
        line_up_b: line_up_b
      }
    end
  end
end
