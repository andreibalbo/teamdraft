class GroupsController < ApplicationController
  def index
    result = GroupService::List.new(user: current_user).call
    @groups = result[:groups]
  end

  def show
    result = GroupService::Details.new(
      group_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      @memberships = result[:memberships]
      @group = result[:group]
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def new
    @group = Group.new
  end

  def edit
    result = GroupService::Edit.new(
      group_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      @group = result[:group]
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def create
    result = GroupService::Create.new(
      params: group_params,
      user: current_user
    ).call

    if result[:success]
      redirect_to result[:group], notice: "Group was successfully created."
    else
      @group = result[:group]
      render :new, status: :unprocessable_entity
    end
  end

  def update
    result = GroupService::Update.new(
      group_id: params[:id],
      params: group_params,
      user: current_user
    ).call

    if result[:success]
      redirect_to result[:group], notice: "Group was successfully updated."
    else
      @group = result[:group]
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    result = GroupService::Destroy.new(
      group_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      redirect_to groups_url, notice: "Group was successfully deleted."
    else
      redirect_to groups_path, alert: result[:error] || "Failed to delete group."
    end
  end

private
  def group_params
    params.require(:group).permit(:name, :description, :category)
  end
end
