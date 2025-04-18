class DraftsController < ApplicationController
  def show
    result = DraftService::Details.new(
      draft_id: params[:id],
      user: current_user
    ).call

    if result[:success]
      @draft = result[:draft]
      @match = result[:match]
      @group = result[:group]
      @line_up_a = result[:line_up_a]
      @line_up_b = result[:line_up_b]
    else
      path = @draft&.match ? match_path(@draft.match) : root_path
      redirect_to path, alert: result[:error]
    end
  end

  def generate
    @match = Match.find(params[:match_id])
    weights = params[:weights]&.transform_values(&:to_f) || {
      positioning: 1.0,
      attack: 1.0,
      defense: 1.0,
      stamina: 1.0
    }

    result = DraftService::Generate.new(
      match_id: params[:match_id],
      user: current_user,
      algorithm: params[:algorithm] || "genetic",
      weights: weights
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
      path = result[:match] ? match_path(result[:match]) : root_path
      redirect_to path, alert: result[:error]
    end
  end
end
