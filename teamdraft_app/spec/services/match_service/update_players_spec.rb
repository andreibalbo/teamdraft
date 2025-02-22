require 'rails_helper'

RSpec.describe MatchService::UpdatePlayers do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let!(:match) { create(:match, group: group) }
  let!(:player1) { create(:player, group: group) }
  let!(:player2) { create(:player, group: group) }

  describe '#call' do
    context 'when user is group admin' do
      it 'updates match players' do
        result = described_class.new(
          match_id: match.id,
          player_ids: [ player1.id, player2.id ],
          user: user
        ).call

        expect(result[:success]).to be true
        expect(result[:match].players).to match_array([ player1, player2 ])
      end

      it 'removes all players when empty array is passed' do
        # First add some players
        match.players << [ player1, player2 ]

        result = described_class.new(
          match_id: match.id,
          player_ids: [],
          user: user
        ).call

        expect(result[:success]).to be true
        expect(result[:match].players).to be_empty
      end

      context 'with invalid player' do
        let(:other_group) { create(:group) }
        let(:invalid_player) { create(:player, group: other_group) }

        it 'returns error' do
          result = described_class.new(
            match_id: match.id,
            player_ids: [ invalid_player.id ],
            user: user
          ).call

          expect(result[:success]).to be false
          expect(result[:error]).to eq("Invalid player selection")
        end
      end
    end

    context 'when match does not exist' do
      it 'returns error' do
        result = described_class.new(
          match_id: 0,
          player_ids: [ player1.id ],
          user: user
        ).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Match not found")
      end
    end

    context 'when user is not group admin' do
      let(:other_user) { create(:user) }

      it 'returns access denied error' do
        result = described_class.new(
          match_id: match.id,
          player_ids: [ player1.id ],
          user: other_user
        ).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Access denied")
      end
    end
  end
end
