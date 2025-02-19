FactoryBot.define do
  factory :group do
    name { Faker::Team.name }
    description { Faker::Lorem.paragraph }
    category { %w[society soccer indoor].sample }
  end
end
