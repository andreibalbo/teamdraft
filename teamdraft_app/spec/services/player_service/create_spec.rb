require 'rails_helper'

RSpec.describe PlayerService::Create do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let(:valid_params) do
    {
      name: "Player 1",
      positioning: 50,
      defense: 70,
      attack: 80,
      stamina: 90
    }
  end

  describe '#call' do
    context 'when user is group admin' do
      it 'creates a new player' do
        result = described_class.new(
          group_id: group.id,
          params: valid_params,
          user: user
        ).call

        expect(result[:success]).to be true
        expect(result[:player]).to be_persisted
        expect(result[:player].name).to eq("Player 1")
        expect(result[:group]).to eq(group)
      end

      context 'with invalid params' do
        let(:invalid_params) { { name: "" } }

        it 'returns error' do
          result = described_class.new(
            group_id: group.id,
            params: invalid_params,
            user: user
          ).call

          expect(result[:success]).to be false
          expect(result[:player]).not_to be_persisted
        end
      end
    end

    context 'when user is not group admin' do
      let(:other_user) { create(:user) }

      it 'returns error' do
        result = described_class.new(
          group_id: group.id,
          params: valid_params,
          user: other_user
        ).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Group not found or access denied")
      end
    end
  end
end
