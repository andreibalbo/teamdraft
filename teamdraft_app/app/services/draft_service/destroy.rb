module DraftService
  class Destroy
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

      if draft.destroy
        {
          success: true,
          match: match,
          group: group
        }
      else
        {
          success: false,
          error: "Failed to delete draft",
          match: match,
          group: group
        }
      end
    end
  end
end
