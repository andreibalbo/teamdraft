require 'rails_helper'

RSpec.describe PlayerService::List do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let!(:players) { create_list(:player, 3, group: group) }

  describe '#call' do
    context 'when user is group admin' do
      it 'returns success with players and group' do
        result = described_class.new(group_id: group.id, user: user).call

        expect(result[:success]).to be true
        expect(result[:players]).to match_array(players)
        expect(result[:group]).to eq(group)
      end
    end

    context 'when user is not group admin' do
      let(:other_user) { create(:user) }

      it 'returns error' do
        result = described_class.new(group_id: group.id, user: other_user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Group not found")
      end
    end
  end
end
