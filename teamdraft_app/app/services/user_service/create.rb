module UserService
  class Create
    def initialize(params)
      @params = params
    end

    def call
      user = User.new(@params)

      if user.save
        { success: true, user: user }
      else
        { success: false, user: user }
      end
    end
  end
end
