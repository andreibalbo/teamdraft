require 'rails_helper'

RSpec.describe PlayerService::Details do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let!(:player) { create(:player, group: group) }

  describe '#call' do
    context 'when user is group admin' do
      it 'returns success with player and group' do
        result = described_class.new(player_id: player.id, user: user).call

        expect(result[:success]).to be true
        expect(result[:player]).to eq(player)
        expect(result[:group]).to eq(group)
      end
    end

    context 'when player does not exist' do
      it 'returns error' do
        result = described_class.new(player_id: 0, user: user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Player not found")
      end
    end

    context 'when user is not group admin' do
      let(:other_user) { create(:user) }

      it 'returns access denied error' do
        result = described_class.new(player_id: player.id, user: other_user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Access denied")
      end
    end
  end
end
