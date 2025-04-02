require 'rails_helper'

RSpec.describe Draft, type: :model do
  describe 'associations' do
    it { should belong_to(:match) }
  end

  describe 'validations' do
    it { should validate_presence_of(:balance_score) }
    it { should validate_numericality_of(:balance_score) }
  end

  let(:group) { create(:group) }
  let(:match) { create(:match, group: group) }
  let(:players) { create_list(:player, 4, group: group) }

  before do
    players.each { |player| create(:participation, match: match, player: player) }
  end

  describe 'custom validations' do
    it 'validates players belong to match group' do
      other_group_player = create(:player)
      draft = build(:draft,
        match: match,
        team_a_player_ids: [ players[0].id, other_group_player.id ],
        team_b_player_ids: [ players[1].id ]
      )

      expect(draft).not_to be_valid
      expect(draft.errors[:base]).to include("All players must be from the match")
    end

    it 'validates players are not in both teams' do
      draft = build(:draft,
        match: match,
        team_a_player_ids: [ players[0].id, players[1].id ],
        team_b_player_ids: [ players[1].id, players[2].id ]
      )

      expect(draft).not_to be_valid
      expect(draft.errors[:base]).to include("Players cannot be in both teams")
    end

    it 'validates weights are valid' do
      draft = build(:draft, weights: { positioning: 1, attack: 1, defense: 1, stamina: 1 })
      expect(draft).to be_valid
    end

    it 'validates weights keys are present' do
      draft = build(:draft, weights: { positioning: 1, attack: 1, defense: 1 })
      expect(draft).not_to be_valid
      expect(draft.errors[:base]).to include("Weights must be a valid set of weights")
    end

    it 'validates weights values are valid' do
      draft = build(:draft, weights: { positioning: 1, attack: 1, defense: 1, stamina: "invalid" })
      expect(draft).not_to be_valid
      expect(draft.errors[:base]).to include("Weights must be valid numbers")
    end
  end

  describe '#team_stats' do
    let(:draft) do
      create(:draft,
        match: match,
        team_a_player_ids: [ players[0].id, players[1].id ],
        team_b_player_ids: [ players[2].id, players[3].id ]
      )
    end

    it 'calculates team A stats correctly' do
      stats = draft.team_a_stats
      team_a = draft.team_a_players

      expect(stats[:attack]).to eq(team_a.sum(&:attack))
      expect(stats[:defense]).to eq(team_a.sum(&:defense))
      expect(stats[:stamina]).to eq(team_a.sum(&:stamina))
      expect(stats[:positioning]).to eq(team_a.sum(&:positioning))
    end

    it 'calculates team B stats correctly' do
      stats = draft.team_b_stats
      team_b = draft.team_b_players

      expect(stats[:attack]).to eq(team_b.sum(&:attack))
      expect(stats[:defense]).to eq(team_b.sum(&:defense))
      expect(stats[:stamina]).to eq(team_b.sum(&:stamina))
      expect(stats[:positioning]).to eq(team_b.sum(&:positioning))
    end
  end

  describe '#team_stats_difference' do
    let(:draft) do
      create(:draft,
        match: match,
        team_a_player_ids: [ players[0].id, players[1].id ],
        team_b_player_ids: [ players[2].id, players[3].id ]
      )
    end

    it 'calculates differences between teams correctly' do
      diff = draft.team_stats_difference
      a_stats = draft.team_a_stats
      b_stats = draft.team_b_stats

      expect(diff[:attack]).to eq((a_stats[:attack] - b_stats[:attack]).abs)
      expect(diff[:defense]).to eq((a_stats[:defense] - b_stats[:defense]).abs)
      expect(diff[:stamina]).to eq((a_stats[:stamina] - b_stats[:stamina]).abs)
      expect(diff[:positioning]).to eq((a_stats[:positioning] - b_stats[:positioning]).abs.round(2))
    end
  end
end
