module GroupService
  class Create
    def initialize(params:, user:)
      @params = params
      @user = user
    end

    def call
      group = Group.new(@params)

      if group.save
        group.memberships.create!(user: @user, role: :admin)
        { success: true, group: group }
      else
        { success: false, group: group }
      end
    end
  end
end
