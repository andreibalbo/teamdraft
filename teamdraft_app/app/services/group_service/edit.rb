module GroupService
  class Edit
    def initialize(group_id:, user:)
      @group_id = group_id
      @user = user
    end

    def call
      group = @user.managed_groups.find_by(id: @group_id)

      if group
        { success: true, group: group }
      else
        { success: false, error: "You don't have permission to edit this group" }
      end
    end
  end
end
