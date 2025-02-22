require 'rails_helper'

RSpec.describe Participation, type: :model do
  describe 'associations' do
    it { should belong_to(:player) }
    it { should belong_to(:match) }
  end

  describe 'validations' do
    let(:group) { create(:group) }
    let(:player) { create(:player, group: group) }
    let(:match) { create(:match, group: group) }
    let(:other_group) { create(:group) }
    let(:other_match) { create(:match, group: other_group) }

    it 'validates player uniqueness in match scope' do
      create(:participation, player: player, match: match)
      duplicate = build(:participation, player: player, match: match)
      expect(duplicate).not_to be_valid
    end

    it 'validates player belongs to match group' do
      participation = build(:participation, player: player, match: other_match)
      expect(participation).not_to be_valid
      expect(participation.errors[:player]).to include("must belong to the same group as the match")
    end
  end
end
