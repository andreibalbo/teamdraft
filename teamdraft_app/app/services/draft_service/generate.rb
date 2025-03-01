module DraftService
  class Generate
    def initialize(match_id:, user:)
      @match_id = match_id
      @current_user = user
    end

    def call
      match = Match.find_by(id: @match_id)
      return { success: false, error: "Match not found" } unless match

      group = @current_user.managed_groups.find_by(id: match.group_id)
      return { success: false, error: "Access denied" } unless group

      # Get all players and shuffle them randomly
      players = match.players.to_a.shuffle
      mid_point = (players.length / 2.0).ceil

      # Split into two teams
      team_a = players[0...mid_point]
      team_b = players[mid_point..]

      draft = match.drafts.build(
        team_a_player_ids: team_a.map(&:id),
        team_b_player_ids: team_b.map(&:id),
        balance_score: calculate_balance_score(team_a, team_b)
      )

      if draft.save
        {
          success: true,
          match: match,
          draft: draft,
          group: group
        }
      else
        {
          success: false,
          error: "Failed to create draft",
          match: match,
          group: group
        }
      end
    end

    private

      def calculate_balance_score(team_a, team_b)
        # Simple initial balance score calculation
        # Lower score means more balanced teams
        a_attack = team_a.sum(&:attack)
        a_defense = team_a.sum(&:defense)
        a_stamina = team_a.sum(&:stamina)

        b_attack = team_b.sum(&:attack)
        b_defense = team_b.sum(&:defense)
        b_stamina = team_b.sum(&:stamina)

        # Calculate differences and normalize
        attack_diff = ((a_attack - b_attack).abs / [ a_attack, b_attack ].max.to_f)
        defense_diff = ((a_defense - b_defense).abs / [ a_defense, b_defense ].max.to_f)
        stamina_diff = ((a_stamina - b_stamina).abs / [ a_stamina, b_stamina ].max.to_f)

        # Average the differences (lower is better)
        (attack_diff + defense_diff + stamina_diff) / 3.0
      end
  end
end
