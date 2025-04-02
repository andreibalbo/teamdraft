FactoryBot.define do
  factory :draft do
    match
    balance_score { rand(0.0..1.0) }
    team_a_player_ids { [] }
    team_b_player_ids { [] }
    weights { { positioning: 1, attack: 1, defense: 1, stamina: 1 } }

    trait :with_teams do
      after(:build) do |draft|
        players = create_list(:player, 4, group: draft.match.group)
        players.each { |player| create(:participation, match: draft.match, player: player) }
        draft.team_a_player_ids = players[0..1].map(&:id)
        draft.team_b_player_ids = players[2..3].map(&:id)
      end
    end
  end
end
