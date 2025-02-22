require 'rails_helper'

RSpec.describe Match, type: :model do
  describe 'associations' do
    it { should belong_to(:group) }
    it { should have_many(:participations).dependent(:destroy) }
    it { should have_many(:players).through(:participations) }
  end

  describe 'validations' do
    it { should validate_presence_of(:datetime) }
  end
end
