
module DraftService
  class LineUp
    def initialize(players: [])
      @players = players
    end

    def call
      return { success: false, formation:   [ [], [], [] ] } if @players.empty?

      sorted_players = @players.sort_by(&:positioning)
      total = sorted_players.length

      formation = if total <= 4
        organize_small_team(sorted_players, total)
      else
        organize_full_team(sorted_players, total)
      end

      {
        success: true,
        formation: formation
      }
    end

    private

      def organize_small_team(sorted_players, total)
        mid_point = (total / 2.0).ceil
        [
          sorted_players[0...mid_point],    # Defense gets extra player if odd
          [],                               # No midfield
          sorted_players[mid_point..-1]     # Attack
        ]
      end

      def organize_full_team(sorted_players, total)
        base_size = total / 3
        remainder = total % 3

        def_size = base_size + (remainder > 0 ? 1 : 0)     # Defense gets first extra
        mid_size = base_size + (remainder > 1 ? 1 : 0)     # Midfield gets second extra

        current_index = 0
        [
          sorted_players[current_index...(current_index += def_size)],
          sorted_players[current_index...(current_index += mid_size)],
          sorted_players[current_index..-1]
        ]
      end
  end
end
