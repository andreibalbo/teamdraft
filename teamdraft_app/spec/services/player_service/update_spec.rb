require 'rails_helper'

RSpec.describe PlayerService::Update do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let!(:player) { create(:player, group: group, name: "Original Name") }

  describe '#call' do
    context 'when user is group admin' do
      it 'updates the player' do
        result = described_class.new(
          player_id: player.id,
          params: { name: "Updated Name" },
          user: user
        ).call

        expect(result[:success]).to be true
        expect(result[:player].name).to eq("Updated Name")
        expect(result[:group]).to eq(group)
      end

      context 'with invalid params' do
        it 'returns error' do
          result = described_class.new(
            player_id: player.id,
            params: { name: "" },
            user: user
          ).call

          expect(result[:success]).to be false
          expect(result[:player].errors).to be_present
          expect(player.reload.name).to eq("Original Name")
        end
      end
    end

    context 'when player does not exist' do
      it 'returns error' do
        result = described_class.new(
          player_id: 0,
          params: { name: "Updated Name" },
          user: user
        ).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Player not found")
      end
    end

    context 'when user is not group admin' do
      let(:other_user) { create(:user) }

      it 'returns access denied error' do
        result = described_class.new(
          player_id: player.id,
          params: { name: "Updated Name" },
          user: other_user
        ).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Access denied")
      end
    end
  end
end
