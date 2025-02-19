require 'rails_helper'

RSpec.describe Group, type: :model do
  describe 'validations' do
    subject { build(:group) }

    it { should validate_presence_of(:name) }
    it { should validate_inclusion_of(:category).in_array(%w[society soccer indoor]) }
  end
end
