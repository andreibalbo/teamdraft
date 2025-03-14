module GroupService
  class List
    def initialize(user:)
      @user = user
    end

    def call
      groups = @user.groups.includes(:players)
      { success: true, groups: groups }
    end
  end
end
