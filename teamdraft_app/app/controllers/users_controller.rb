class UsersController < ApplicationController
  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    puts "User params: #{@user.inspect}"

    if @user.save
      session[:user_id] = @user.id
      redirect_to root_url, notice: "Account created successfully!"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

    def user_params
      params.require(:user).permit(:email, :password, :password_confirmation)
    end
end
