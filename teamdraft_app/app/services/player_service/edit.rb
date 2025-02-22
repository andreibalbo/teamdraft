module PlayerService
  class Edit
    def initialize(player_id:, user:)
      @player_id = player_id
      @current_user = user
    end

    def call
      player = Player.find_by(id: @player_id)
      return { success: false, error: "Player not found" } unless player

      group = @current_user.managed_groups.find_by(id: player.group_id)
      return { success: false, error: "Access denied" } unless group

      {
        success: true,
        player: player,
        group: group
      }
    end
  end
end
