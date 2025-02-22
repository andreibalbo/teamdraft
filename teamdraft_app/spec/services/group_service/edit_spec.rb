require 'rails_helper'

RSpec.describe GroupService::Edit do
  let(:user) { create(:user) }
  let(:group) { create(:group) }

  describe '#call' do
    context 'when user is admin' do
      let!(:membership) { create(:membership, :admin, user: user, group: group) }

      it 'returns success with group' do
        result = described_class.new(group_id: group.id, user: user).call

        expect(result[:success]).to be true
        expect(result[:group]).to eq(group)
      end
    end

    context 'when user is regular member' do
      let!(:membership) { create(:membership, user: user, group: group) }

      it 'returns error' do
        result = described_class.new(group_id: group.id, user: user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("You don't have permission to edit this group")
      end
    end

    context 'when user is not a member' do
      it 'returns error' do
        result = described_class.new(group_id: group.id, user: user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("You don't have permission to edit this group")
      end
    end
  end
end
