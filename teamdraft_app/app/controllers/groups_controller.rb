class GroupsController < ApplicationController
  before_action :set_group, only: [ :show, :edit, :update, :destroy ]
  before_action :set_managed_group, only: [ :edit, :update ]
  rescue_from ActiveRecord::RecordNotFound, with: :group_not_found

  def index
    @groups = current_user.groups
  end

  def show
    @memberships = @group.memberships.includes(:user)
  end

  def new
    @group = Group.new
  end

  def edit
  end

  def create
    @group = Group.new(group_params)

    if @group.save
      @group.memberships.create!(user: current_user, role: :admin)
      redirect_to @group, notice: "Group was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @group.update(group_params)
      redirect_to @group, notice: "Group was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @group.destroy
    redirect_to groups_url, notice: "Group was successfully deleted."
  end

private

  def set_group
    @group = current_user.groups.find(params[:id])
  end

  def set_managed_group
    @group = current_user.managed_groups.find(params[:id])
  end

  def group_params
    params.require(:group).permit(:name, :description, :category)
  end

  def group_not_found
    redirect_to root_path, alert: "You don't have access to this group"
  end
end
