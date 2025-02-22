require 'rails_helper'

RSpec.describe MatchService::List do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group) }
  let!(:matches) { create_list(:match, 3, group: group) }

  describe '#call' do
    context 'when user is group member' do
      it 'returns success with matches and group' do
        result = described_class.new(group_id: group.id, user: user).call

        expect(result[:success]).to be true
        expect(result[:matches]).to match_array(matches)
        expect(result[:group]).to eq(group)
      end
    end

    context 'when user is not group member' do
      let(:other_user) { create(:user) }

      it 'returns error' do
        result = described_class.new(group_id: group.id, user: other_user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Group not found")
      end
    end
  end
end
