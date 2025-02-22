module PlayerService
  class Update
    def initialize(player_id:, params:, user:)
      @player_id = player_id
      @params = params
      @current_user = user
    end

    def call
      player = Player.find_by(id: @player_id)
      return { success: false, error: "Player not found" } unless player

      group = @current_user.managed_groups.find_by(id: player.group_id)
      return { success: false, error: "Access denied" } unless group

      if player.update(@params)
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
