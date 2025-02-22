FactoryBot.define do
  factory :player do
    name { Faker::Name.name }
    positioning { Faker::Number.between(from: 0, to: 100) }
    defense { Faker::Number.between(from: 0, to: 100) }
    attack { Faker::Number.between(from: 0, to: 100) }
    stamina { Faker::Number.between(from: 0, to: 100) }
    group { create(:group) }
  end
end
