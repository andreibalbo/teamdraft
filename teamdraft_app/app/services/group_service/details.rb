module GroupService
  class Details
    def initialize(group_id:, user:)
      @group_id = group_id
      @user = user
    end

    def call
      group = @user.groups.find_by(id: @group_id)

      if group
        memberships = group.memberships.includes(:user)
        {
          success: true,
          group: group,
          memberships: memberships
        }
      else
        { success: false, error: "Group not found" }
      end
    end
  end
end
