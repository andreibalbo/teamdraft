require 'rails_helper'

RSpec.describe Match, type: :model do
  describe 'associations' do
    it { should belong_to(:group) }
  end

  describe 'validations' do
    it { should validate_presence_of(:datetime) }
  end
end
