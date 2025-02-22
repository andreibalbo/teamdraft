module GroupService
  class Update
    def initialize(group_id:, params:, user:)
      @group_id = group_id
      @params = params
      @user = user
    end

    def call
      group = @user.managed_groups.find_by(id: @group_id)

      return { success: false, error: "You don't have permission to update this group" } unless group

      if group.update(@params)
        { success: true, group: group }
      else
        { success: false, group: group }
      end
    end
  end
end
