require 'rails_helper'

RSpec.describe MatchService::New do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }

  describe '#call' do
    context 'when user is group admin' do
      it 'returns success with new match instance and group' do
        result = described_class.new(group_id: group.id, user: user).call

        expect(result[:success]).to be true
        expect(result[:match]).to be_a_new(Match)
        expect(result[:match].group).to eq(group)
        expect(result[:group]).to eq(group)
      end
    end

    context 'when group does not exist' do
      it 'returns error' do
        result = described_class.new(group_id: 0, user: user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Group not found")
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
