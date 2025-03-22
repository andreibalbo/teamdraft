class PlayersController < ApplicationController
  def index
    result = PlayerService::List.new(
      group_id: params[:group_id],
      user: current_user
    ).call

    if result[:success]
      @players = result[:players]
      @group = result[:group]
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def show
    result = PlayerService::Details.new(
      player_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      @player = result[:player]
      @group = result[:group]
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def new
    result = PlayerService::New.new(
      group_id: params[:group_id],
      user: current_user
    ).call

    if result[:success]
      @group = result[:group]
      @player = result[:player]
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def create
    result = PlayerService::Create.new(
      group_id: params[:group_id],
      params: player_params,
      user: current_user
    ).call

    if result[:success]
      redirect_to group_path(result[:group]), notice: "Player was successfully created."
    else
      @player = result[:player]
      @group = result[:group]
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    result = PlayerService::Edit.new(
      player_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      @player = result[:player]
      @group = result[:group]
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def update
    result = PlayerService::Update.new(
      player_id: params[:id],
      params: player_params,
      user: current_user
    ).call

    if result[:success]
      redirect_to group_path(result[:group]), notice: "Player was successfully updated."
    else
      @player = result[:player]
      @group = result[:group]
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    result = PlayerService::Destroy.new(
      player_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      redirect_to group_path(result[:group]), notice: "Player was successfully deleted."
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  private

    def player_params
      params.require(:player).permit(:name, :positioning, :defense, :attack, :stamina)
    end
end
