class DraftsController < ApplicationController
  before_action :authenticate_user!

  def show
    result = DraftService::Details.new(
      draft_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      @draft = result[:draft]
      @match = result[:match]
      @group = result[:group]
    else
      redirect_to match_path(@draft.match), alert: result[:error]
    end
  end

  def generate
    result = DraftService::Generate.new(
      match_id: params[:match_id],
      user: current_user
    ).call

    if result[:success]
      draft = result[:draft]
      redirect_to draft_path(draft), notice: "Draft was successfully generated."
    else
      redirect_to match_path(params[:match_id]), alert: result[:error]
    end
  end

  def destroy
    result = DraftService::Destroy.new(
      draft_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      redirect_to match_path(result[:match]), notice: "Draft was successfully deleted."
    else
      redirect_to match_path(params[:match_id]), alert: result[:error]
    end
  end
end
