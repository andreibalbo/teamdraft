require 'rails_helper'

RSpec.describe GroupService::Update do
  let(:user) { create(:user) }
  let(:group) { create(:group, name: "Original Name") }
  let(:valid_params) { { name: "Updated Name" } }

  describe '#call' do
    context 'when user is admin' do
      let!(:membership) { create(:membership, :admin, user: user, group: group) }

      it 'updates the group' do
        result = described_class.new(
          group_id: group.id,
          params: valid_params,
          user: user
        ).call

        expect(result[:success]).to be true
        expect(result[:group].name).to eq("Updated Name")
      end

      context 'with invalid params' do
        let(:invalid_params) { { name: "", category: "invalid" } }

        it 'returns error' do
          result = described_class.new(
            group_id: group.id,
            params: invalid_params,
            user: user
          ).call

          expect(result[:success]).to be false
          expect(result[:group].errors).to be_present
          expect(group.reload.name).to eq("Original Name")
        end
      end
    end

    context 'when user is not admin' do
      let!(:membership) { create(:membership, user: user, group: group) }

      it 'returns error' do
        result = described_class.new(
          group_id: group.id,
          params: valid_params,
          user: user
        ).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("You don't have permission to update this group")
      end
    end
  end
end
