require 'rails_helper'

RSpec.describe GroupService::Create do
  let(:user) { create(:user) }
  let(:valid_params) do
    {
      name: "Test Group",
      category: "society",
      description: "Test description"
    }
  end

  describe '#call' do
    context 'with valid parameters' do
      it 'creates a new group' do
        expect {
          described_class.new(params: valid_params, user: user).call
        }.to change(Group, :count).by(1)
      end

      it 'creates membership with admin role' do
        expect {
          described_class.new(params: valid_params, user: user).call
        }.to change(Membership, :count).by(1)

        membership = Membership.last
        expect(membership.role).to eq('admin')
        expect(membership.user).to eq(user)
      end

      it 'returns success with the created group' do
        result = described_class.new(params: valid_params, user: user).call

        expect(result[:success]).to be true
        expect(result[:group]).to be_persisted
        expect(result[:group].name).to eq("Test Group")
      end
    end

    context 'with invalid parameters' do
      let(:invalid_params) { { name: "", category: "invalid" } }

      it 'does not create a group' do
        expect {
          described_class.new(params: invalid_params, user: user).call
        }.not_to change(Group, :count)
      end

      it 'returns failure with the invalid group' do
        result = described_class.new(params: invalid_params, user: user).call

        expect(result[:success]).to be false
        expect(result[:group]).not_to be_persisted
        expect(result[:group].errors).to be_present
      end
    end
  end
end
