require 'rails_helper'

RSpec.describe Player, type: :model do
  describe 'associations' do
    it { should belong_to(:group) }
  end

  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:positioning) }
    it { should validate_presence_of(:defense) }
    it { should validate_presence_of(:attack) }
    it { should validate_presence_of(:stamina) }

    it { should validate_numericality_of(:positioning).is_greater_than_or_equal_to(0).is_less_than_or_equal_to(100) }
    it { should validate_numericality_of(:defense).is_greater_than_or_equal_to(0).is_less_than_or_equal_to(100) }
    it { should validate_numericality_of(:attack).is_greater_than_or_equal_to(0).is_less_than_or_equal_to(100) }
    it { should validate_numericality_of(:stamina).is_greater_than_or_equal_to(0).is_less_than_or_equal_to(100) }
  end
end
