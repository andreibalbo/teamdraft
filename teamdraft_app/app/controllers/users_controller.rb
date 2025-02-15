class UsersController < ApplicationController
  def new
    @user = User.new
  end

  def create
    result = ::UserService::Create.new(user_params).call

    if result[:success]
      session[:user_id] = result[:user].id
      redirect_to root_url, notice: "Account created successfully!"
    else
      @user = result[:user]
      render :new, status: :unprocessable_entity
    end
  end

private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end
end
