module AuthHelper
  def login_as(user)
    visit login_path
    fill_in "Email", with: user.email
    fill_in "Password", with: user.password
    click_button "Log in"
  end
end

RSpec.configure do |config|
  config.include AuthHelper, type: :system
end
