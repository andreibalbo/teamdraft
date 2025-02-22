require 'rails_helper'

RSpec.describe MatchService::Details do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group) }
  let!(:match) { create(:match, group: group) }

  describe '#call' do
    context 'when user is group member' do
      it 'returns success with match and group' do
        result = described_class.new(match_id: match.id, user: user).call

        expect(result[:success]).to be true
        expect(result[:match]).to eq(match)
        expect(result[:group]).to eq(group)
      end
    end

    context 'when match does not exist' do
      it 'returns error' do
        result = described_class.new(match_id: 0, user: user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Match not found")
      end
    end

    context 'when user is not group member' do
      let(:other_user) { create(:user) }

      it 'returns access denied error' do
        result = described_class.new(match_id: match.id, user: other_user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Access denied")
      end
    end
  end
end
