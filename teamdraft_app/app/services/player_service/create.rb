module PlayerService
  class Create
    def initialize(group_id:, params:, user:)
      @group_id = group_id
      @params = params
      @current_user = user
    end

    def call
      group = @current_user.managed_groups.find_by(id: @group_id)
      return { success: false, error: "Group not found or access denied" } unless group

      player = group.players.build(@params)

      if player.save
        {
          success: true,
          player: player,
          group: group
        }
      else
        {
          success: false,
          player: player,
          group: group
        }
      end
    end
  end
end
