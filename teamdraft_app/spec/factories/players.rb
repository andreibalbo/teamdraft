FactoryBot.define do
  factory :player do
    name { Faker::Name.name }
    positioning { Faker::Number.between(from: 0, to: 100) }
    defensive { Faker::Number.between(from: 0, to: 100) }
    offensive { Faker::Number.between(from: 0, to: 100) }
    stamina { Faker::Number.between(from: 0, to: 100) }
    group { create(:group) }
  end
end
