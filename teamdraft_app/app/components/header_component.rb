class HeaderComponent < ViewComponent::Base
  def initialize(title: nil, current_user: nil)
    @title = title
    @current_user = current_user
  end
end
