module MatchService
  class UpdatePlayers
    def initialize(match_id:, player_ids:, user:)
      @match_id = match_id
      @player_ids = Array(player_ids)
      @current_user = user
    end

    def call
      match = Match.find_by(id: @match_id)
      return { success: false, error: "Match not found" } unless match

      group = @current_user.managed_groups.find_by(id: match.group_id)
      return { success: false, error: "Access denied" } unless group

      ActiveRecord::Base.transaction do
        match.participations.destroy_all
        @player_ids.each do |player_id|
          match.participations.create!(player_id: player_id)
        end
      end

      {
        success: true,
        match: match,
        group: group
      }
    rescue ActiveRecord::RecordInvalid => e
      {
        success: false,
        error: "Invalid player selection",
        match: match,
        group: group
      }
    end
  end
end
