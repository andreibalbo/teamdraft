require 'rails_helper'

RSpec.describe MatchService::Create do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let(:valid_params) do
    {
      datetime: 1.day.from_now
    }
  end

  describe '#call' do
    context 'when user is group admin' do
      it 'creates a new match' do
        result = described_class.new(
          group_id: group.id,
          params: valid_params,
          user: user
        ).call

        expect(result[:success]).to be true
        expect(result[:match]).to be_persisted
        expect(result[:match].datetime.to_i).to eq(valid_params[:datetime].to_i)
        expect(result[:group]).to eq(group)
      end

      context 'with invalid params' do
        let(:invalid_params) { { datetime: nil } }

        it 'returns error' do
          result = described_class.new(
            group_id: group.id,
            params: invalid_params,
            user: user
          ).call

          expect(result[:success]).to be false
          expect(result[:match]).not_to be_persisted
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
        expect(result[:error]).to eq("Group not found")
      end
    end
  end
end
