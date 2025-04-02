class MatchesController < ApplicationController
  def index
    result = MatchService::List.new(
      group_id: params[:group_id],
      user: current_user
    ).call

    if result[:success]
      @matches = result[:matches]
      @group = result[:group]
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def show
    result = MatchService::Details.new(
      match_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      @match = result[:match]
      @group = result[:group]
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def new
    result = MatchService::New.new(
      group_id: params[:group_id],
      user: current_user
    ).call

    if result[:success]
      @group = result[:group]
      @match = result[:match]
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def create
    result = MatchService::Create.new(
      group_id: params[:group_id],
      params: match_params,
      user: current_user
    ).call

    if result[:success]
      redirect_to match_path(result[:match]), notice: "Match was successfully created."
    else
      @match = result[:match]
      @group = result[:group]
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    result = MatchService::Edit.new(
      match_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      @match = result[:match]
      @group = result[:group]
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def update
    result = MatchService::Update.new(
      match_id: params[:id],
      params: match_params,
      user: current_user
    ).call

    if result[:success]
      redirect_to match_path(result[:match]), notice: "Match was successfully updated."
    else
      @match = result[:match]
      @group = result[:group]
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    result = MatchService::Destroy.new(
      match_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      redirect_to group_path(result[:group]), notice: "Match was successfully deleted."
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def players
    result = MatchService::Details.new(
      match_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      @match = result[:match]
      @group = result[:group]
      @available_players = @group.players
      @selected_player_ids = @match.player_ids
    else
      redirect_to groups_path, alert: result[:error]
    end
  end

  def update_players
    result = MatchService::UpdatePlayers.new(
      match_id: params[:id],
      player_ids: params[:player_ids],
      user: current_user
    ).call

    if result[:success]
      redirect_to match_path(result[:match]), notice: "Players updated successfully."
    else
      @match = result[:match]
      @group = result[:group]
      @available_players = @group.players
      @selected_player_ids = params[:player_ids]
      render :players, status: :unprocessable_entity
    end
  end

  private

    def match_params
      params.require(:match).permit(:datetime)
    end
end
