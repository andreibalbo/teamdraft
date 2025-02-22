require 'rails_helper'

RSpec.describe GroupService::Details do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group) }
  let!(:players) { create_list(:player, 3, group: group) }

  describe '#call' do
    context 'when user is a member' do
      it 'returns success with group details' do
        result = described_class.new(group_id: group.id, user: user).call

        expect(result[:success]).to be true
        expect(result[:group]).to eq(group)
        expect(result[:memberships]).to include(membership)
        expect(result[:players]).to match_array(players)
      end
    end

    context 'when user is not a member' do
      let(:other_user) { create(:user) }

      it 'returns error' do
        result = described_class.new(group_id: group.id, user: other_user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("You don't have permission to view this group")
      end
    end
  end
end
