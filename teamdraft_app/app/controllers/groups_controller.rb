class GroupsController < ApplicationController
  before_action :set_group, only: [ :show, :edit, :update, :destroy ]

  def index
    @groups = Group.all
    render json: @groups
  end

  def show
    render json: @group
  end

  def create
    @group = Group.new(group_params)

    if @group.save
      render json: @group, status: :created
    else
      render json: @group.errors, status: :unprocessable_entity
    end
  end

  def update
    if @group.update(group_params)
      render json: @group
    else
      render json: @group.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @group.destroy
    head :no_content
  end

  def new
    @group = Group.new
  end

  def edit
  end

private

  def set_group
    @group = Group.find(params[:id])
  end

  def group_params
    params.require(:group).permit(:name, :description, :category)
  end
end
