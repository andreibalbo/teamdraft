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

      {
        success: true,
        draft: draft,
        match: match,
        group: group
      }
    end
  end
end
