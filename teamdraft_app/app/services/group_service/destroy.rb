module GroupService
  class Destroy
    def initialize(group_id:, user:)
      @group_id = group_id
      @user = user
    end

    def call
      group = @user.managed_groups.find_by(id: @group_id)

      return { success: false, error: "You don't have permission to delete this group" } unless group

      if group.destroy
        { success: true }
      else
        { success: false, error: "Failed to delete group" }
      end
    end
  end
end
