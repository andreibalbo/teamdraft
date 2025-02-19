require 'rails_helper'

RSpec.describe Membership, type: :model do
  describe 'validations' do
    subject { build(:membership) }

    it { should belong_to(:user) }
    it { should belong_to(:group) }
    it { should validate_presence_of(:role) }
    it { should validate_inclusion_of(:role).in_array(%w[admin member]) }

    it "validates uniqueness of user_id scoped to group_id" do
      membership = create(:membership)
      duplicate = build(:membership, user: membership.user, group: membership.group)
      expect(duplicate).not_to be_valid
    end
  end
end
