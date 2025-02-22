FactoryBot.define do
  factory :player do
    name { Faker::Name.name }
    positioning { rand(0..100) }
    defense { rand(0..100) }
    attack { rand(0..100) }
    stamina { rand(0..100) }
    group
  end
end
