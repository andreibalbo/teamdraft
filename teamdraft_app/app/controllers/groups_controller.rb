class GroupsController < ApplicationController
  before_action :set_group, only: [ :show, :edit, :update, :destroy ]

  def index
    @groups = Group.all
    respond_to do |format|
      format.html
      format.json { render json: @groups }
    end
  end

  def show
    respond_to do |format|
      format.html
      format.json { render json: @group }
    end
  end

  def create
    @group = Group.new(group_params)

    respond_to do |format|
      if @group.save
        format.html { redirect_to @group, notice: "Group was successfully created." }
        format.json { render json: @group, status: :created }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @group.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      if @group.update(group_params)
        format.html { redirect_to @group, notice: "Group was successfully updated." }
        format.json { render json: @group }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @group.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @group.destroy
    respond_to do |format|
      format.html { redirect_to groups_url, notice: "Group was successfully deleted." }
      format.json { head :no_content }
    end
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
