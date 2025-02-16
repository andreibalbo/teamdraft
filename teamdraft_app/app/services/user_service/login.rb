module UserService
  class Login
    def initialize(params)
      @email = params[:email]
      @password = params[:password]
    end

    def call
      user = User.find_by(email: @email)

      if user&.authenticate(@password)
        { success: true, user: user }
      else
        { success: false, user: user }
      end
    end
  end
end
