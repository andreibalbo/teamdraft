module GroupService
  class Details
    def initialize(group_id:, user:)
      @group_id = group_id
      @current_user = user
    end

    def call
      group = @current_user.groups.find_by(id: @group_id)

      if group
        memberships = group.memberships.includes(:user)
        matches = group.matches.includes(:participations)
        {
          success: true,
          group: group,
          memberships: memberships,
          matches: matches,
          players: group.players
        }
      else
        { success: false, error: "You don't have permission to view this group" }
      end
    end
  end
end
