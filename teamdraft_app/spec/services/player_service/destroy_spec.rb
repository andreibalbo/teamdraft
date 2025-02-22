require 'rails_helper'

RSpec.describe PlayerService::Destroy do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let!(:player) { create(:player, group: group) }

  describe '#call' do
    context 'when user is group admin' do
      it 'destroys the player' do
        result = described_class.new(player_id: player.id, user: user).call

        expect(result[:success]).to be true
        expect(result[:group]).to eq(group)
        expect(Player.exists?(player.id)).to be false
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
        expect(Player.exists?(player.id)).to be true
      end
    end
  end
end
