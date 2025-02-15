require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email).case_insensitive }
    it { should validate_presence_of(:password) }
    it { should validate_confirmation_of(:password) }
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

  # Add other model validations/methods tests here
end
