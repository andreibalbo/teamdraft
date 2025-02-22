RSpec.configure do |config|
  config.before(:each, type: :system) do
    driven_by :rack_test
  end

  # If we need JavaScript testing later:
  # config.before(:each, type: :system, js: true) do
  #   driven_by :selenium_headless
  # end
end
