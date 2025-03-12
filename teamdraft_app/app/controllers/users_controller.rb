class UsersController < ApplicationController
  skip_before_action :authenticate_user!, only: [ :new, :create ]
  def new
    redirect_to root_path if current_user
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
