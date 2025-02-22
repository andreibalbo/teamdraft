require 'rails_helper'

RSpec.describe GroupService::Destroy do
  let(:user) { create(:user) }
  let(:group) { create(:group) }

  describe '#call' do
    context 'when user is admin' do
      let!(:membership) { create(:membership, :admin, user: user, group: group) }

      it 'destroys the group' do
        expect {
          described_class.new(group_id: group.id, user: user).call
        }.to change(Group, :count).by(-1)
      end

      it 'returns success' do
        result = described_class.new(group_id: group.id, user: user).call

        expect(result[:success]).to be true
      end
    end

    context 'when user is not admin' do
      let!(:membership) { create(:membership, user: user, group: group) }

      it 'does not destroy the group' do
        expect {
          described_class.new(group_id: group.id, user: user).call
        }.not_to change(Group, :count)
      end

      it 'returns error' do
        result = described_class.new(group_id: group.id, user: user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("You don't have permission to delete this group")
      end
    end

    context 'when group does not exist' do
      it 'returns error' do
        result = described_class.new(group_id: 0, user: user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("You don't have permission to delete this group")
      end
    end
  end
end
