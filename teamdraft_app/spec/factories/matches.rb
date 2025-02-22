FactoryBot.define do
  factory :match do
    datetime { 1.day.from_now }
    group
  end
end
