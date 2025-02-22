module MatchService
  class List
    def initialize(group_id:, user:)
      @group_id = group_id
      @current_user = user
    end

    def call
      group = @current_user.groups.find_by(id: @group_id)
      return { success: false, error: "Group not found" } unless group

      {
        success: true,
        matches: group.matches,
        group: group
      }
    end
  end
end
