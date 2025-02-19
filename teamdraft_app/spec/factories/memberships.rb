FactoryBot.define do
  factory :membership do
    user
    group
    role { "member" }

    trait :admin do
      role { "admin" }
    end
  end
end
