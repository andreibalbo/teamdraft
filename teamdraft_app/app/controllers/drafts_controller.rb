class DraftsController < ApplicationController
  before_action :authenticate_user!

  def generate
    result = DraftService::Generate.new(
      match_id: params[:match_id],
      user: current_user
    ).call

    if result[:success]
      @match = result[:match]
      @draft = result[:draft]
      @group = result[:group]
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
