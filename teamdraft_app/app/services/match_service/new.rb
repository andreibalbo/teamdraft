module MatchService
  class New
    def initialize(group_id:, user:)
      @group_id = group_id
      @current_user = user
    end

    def call
      group = @current_user.managed_groups.find_by(id: @group_id)
      return { success: false, error: "Group not found" } unless group

      match = group.matches.build
      {
        success: true,
        match: match,
        group: group
      }
    end
  end
end
