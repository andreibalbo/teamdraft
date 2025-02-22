require 'rails_helper'

RSpec.describe "Drafts", type: :request do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let(:match) { create(:match, group: group) }
  let!(:players) { create_list(:player, 4, group: group) }
  let!(:participations) do
    players.each { |player| create(:participation, match: match, player: player) }
  end

  before do
    post "/login", params: { email: user.email, password: user.password }
  end

  describe "POST /matches/:match_id/drafts/generate" do
    it "generates a new draft" do
      expect {
        post generate_match_drafts_path(match)
      }.to change(Draft, :count).by(1)

      expect(response).to redirect_to(draft_path(Draft.last))
      expect(flash[:notice]).to eq("Draft was successfully generated.")
    end

    context "when user is not authorized" do
      let(:other_user) { create(:user) }
      before { sign_in other_user }

      it "does not generate draft" do
        expect {
          post generate_match_drafts_path(match)
        }.not_to change(Draft, :count)

        expect(response).to redirect_to(match_path(match))
        expect(flash[:alert]).to eq("Access denied")
      end
    end
  end

  describe "GET /drafts/:id" do
    let(:draft) { create(:draft, :with_teams, match: match) }

    it "shows the draft" do
      get draft_path(draft)
      expect(response).to have_http_status(:success)
    end

    context "when user is not authorized" do
      let(:other_user) { create(:user) }
      before { post "/login", params: { email: other_user.email, password: other_user.password } }

      it "redirects to match path" do
        get draft_path(draft)
        expect(response).to redirect_to(match_path(draft.match))
        expect(flash[:alert]).to eq("Access denied")
      end
    end
  end

  describe "DELETE /matches/:match_id/drafts/:id" do
    let!(:draft) { create(:draft, :with_teams, match: match) }

    it "deletes the draft" do
      expect {
        delete match_draft_path(match, draft)
      }.to change(Draft, :count).by(-1)

      expect(response).to redirect_to(match_path(match))
      expect(flash[:notice]).to eq("Draft was successfully deleted.")
    end

    context "when user is not authorized" do
      let(:other_user) { create(:user) }
      before { post "/login", params: { email: other_user.email, password: other_user.password } }

      it "does not delete the draft" do
        expect {
          delete match_draft_path(match, draft)
        }.not_to change(Draft, :count)

        expect(response).to redirect_to(match_path(match))
        expect(flash[:alert]).to eq("Access denied")
      end
    end
  end
end
