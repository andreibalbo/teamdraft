require 'rails_helper'

RSpec.describe MatchService::Update do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let!(:match) { create(:match, group: group, datetime: 1.day.from_now) }

  describe '#call' do
    context 'when user is group admin' do
      it 'updates the match' do
        new_datetime = 2.days.from_now
        result = described_class.new(
          match_id: match.id,
          params: { datetime: new_datetime },
          user: user
        ).call

        expect(result[:success]).to be true
        expect(result[:match].datetime.to_i).to eq(new_datetime.to_i)
        expect(result[:group]).to eq(group)
      end

      context 'with invalid params' do
        it 'returns error' do
          result = described_class.new(
            match_id: match.id,
            params: { datetime: nil },
            user: user
          ).call

          expect(result[:success]).to be false
          expect(result[:match].errors).to be_present
          expect(match.reload.datetime.to_i).to eq(match.datetime.to_i)
        end
      end
    end

    context 'when match does not exist' do
      it 'returns error' do
        result = described_class.new(
          match_id: 0,
          params: { datetime: 1.day.from_now },
          user: user
        ).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Match not found")
      end
    end

    context 'when user is not group admin' do
      let(:other_user) { create(:user) }

      it 'returns access denied error' do
        result = described_class.new(
          match_id: match.id,
          params: { datetime: 1.day.from_now },
          user: other_user
        ).call

        expect(result[:success]).to be false
        expect(result[:error]).to eq("Access denied")
      end
    end
  end
end
