class SessionsController < ApplicationController
  def new
    redirect_to root_path if current_user
  end

  def create
    result = ::UserService::Login.new(login_params).call

    if result[:success]
      session[:user_id] = result[:user].id
      redirect_to root_url, notice: "Logged in successfully!"
    else
      flash.now[:alert] = "Invalid email or password"
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    session[:user_id] = nil
    redirect_to root_url, notice: "Logged out successfully!", status: :see_other
  end

private

  def login_params
    params.permit(:email, :password)
  end
end
