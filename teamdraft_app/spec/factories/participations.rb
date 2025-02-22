FactoryBot.define do
  factory :participation do
    player
    match

    trait :same_group do
      after(:build) do |participation|
        participation.match.update(group: participation.player.group)
      end
    end
  end
end
