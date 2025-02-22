module MatchService
  class Create
    def initialize(group_id:, params:, user:)
      @group_id = group_id
      @params = params
      @current_user = user
    end

    def call
      group = @current_user.managed_groups.find_by(id: @group_id)
      return { success: false, error: "Group not found" } unless group

      match = group.matches.build(@params)

      if match.save
        {
          success: true,
          match: match,
          group: group
        }
      else
        {
          success: false,
          match: match,
          group: group
        }
      end
    end
  end
end
