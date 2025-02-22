require 'rails_helper'

RSpec.describe MatchService::Destroy do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let!(:match) { create(:match, group: group) }

  describe '#call' do
    context 'when user is group admin' do
      it 'destroys the match' do
        expect {
          result = described_class.new(match_id: match.id, user: user).call

          expect(result[:success]).to be true
          expect(result[:group]).to eq(group)
        }.to change(Match, :count).by(-1)
      end
    end

    context 'when match does not exist' do
      it 'returns error' do
        result = described_class.new(match_id: 0, user: user).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Match not found")
      end
    end

    context 'when user is not group admin' do
      let(:other_user) { create(:user) }

      it 'returns access denied error' do
        expect {
          result = described_class.new(match_id: match.id, user: other_user).call

          expect(result[:success]).to be false
          expect(result[:error]).to eq("Access denied")
        }.not_to change(Match, :count)
      end
    end
  end
end
