require 'rails_helper'

RSpec.describe GroupService::List do
  let(:user) { create(:user) }
  let!(:user_group) { create(:group) }
  let!(:other_group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: user_group) }

  describe '#call' do
    it 'returns success with user groups' do
      result = described_class.new(user: user).call

      expect(result[:success]).to be true
      expect(result[:groups]).to include(user_group)
      expect(result[:groups]).not_to include(other_group)
    end
  end
end
