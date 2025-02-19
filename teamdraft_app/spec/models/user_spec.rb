require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    subject { build(:user) }

    it { should validate_presence_of(:email) }
    it { should validate_presence_of(:password) }
    it { should validate_confirmation_of(:password) }
    it { should validate_length_of(:password).is_at_least(6) }
    it { should validate_uniqueness_of(:email).case_insensitive }
  end

  describe 'authentication' do
    let(:user) { create(:user, password: 'password123') }

    it 'authenticates with correct password' do
      expect(user.authenticate('password123')).to eq(user)
    end

    it 'does not authenticate with incorrect password' do
      expect(user.authenticate('wrong_password')).to be_falsey
    end
  end

  describe 'associations' do
    it { should have_many(:memberships).dependent(:destroy) }
    it { should have_many(:groups).through(:memberships) }
    it { should have_many(:managed_groups) }
  end

  describe 'managed_groups association' do
    let(:user) { create(:user) }
    let(:group1) { create(:group) }
    let(:group2) { create(:group) }

    before do
      create(:membership, :admin, user: user, group: group1)
      create(:membership, user: user, group: group2)
    end

    it "only includes groups where user is admin" do
      expect(user.managed_groups).to include(group1)
      expect(user.managed_groups).not_to include(group2)
    end
  end

  # Add other model validations/methods tests here
end
