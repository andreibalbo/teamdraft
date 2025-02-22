require 'rails_helper'

RSpec.describe "Matches", type: :request do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let!(:match) { create(:match, group: group) }

  before do
    post "/login", params: { email: user.email, password: user.password }
  end

  describe "GET /groups/:group_id/matches" do
    it "returns http success" do
      get group_matches_path(group)
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /matches/:id" do
    it "returns http success" do
      get match_path(match)
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /groups/:group_id/matches/new" do
    it "returns http success" do
      get new_group_match_path(group)
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /groups/:group_id/matches" do
    let(:valid_params) do
      {
        match: {
          datetime: 1.day.from_now
        }
      }
    end

    context "with valid parameters" do
      it "creates a new match" do
        expect {
          post group_matches_path(group), params: valid_params
        }.to change(Match, :count).by(1)

        expect(response).to redirect_to(match_path(Match.last))
      end
    end

    context "with invalid parameters" do
      it "does not create a match" do
        expect {
          post group_matches_path(group), params: { match: { datetime: nil } }
        }.not_to change(Match, :count)

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "GET /matches/:id/edit" do
    it "returns http success" do
      get edit_match_path(match)
      expect(response).to have_http_status(:success)
    end
  end

  describe "PATCH /matches/:id" do
    let(:new_datetime) { 2.days.from_now }

    context "with valid parameters" do
      it "updates the match" do
        patch match_path(match), params: { match: { datetime: new_datetime } }
        expect(match.reload.datetime.to_i).to eq(new_datetime.to_i)
        expect(response).to redirect_to(match_path(match))
      end
    end

    context "with invalid parameters" do
      it "does not update the match" do
        patch match_path(match), params: { match: { datetime: nil } }
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "DELETE /matches/:id" do
    it "destroys the match" do
      expect {
        delete match_path(match)
      }.to change(Match, :count).by(-1)

      expect(response).to redirect_to(group_matches_path(group))
    end
  end

  describe "GET /matches/:id/players" do
    it "returns http success" do
      get players_match_path(match)
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /matches/:id/players" do
    let(:player) { create(:player, group: group) }
    let(:other_player) { create(:player, group: group) }

    it "updates match players" do
      post players_match_path(match), params: { player_ids: [ player.id, other_player.id ] }
      expect(response).to redirect_to(match_path(match))
      expect(match.players.reload).to match_array([ player, other_player ])
    end

    context "with invalid player" do
      let(:invalid_player) { create(:player) } # player from different group

      it "renders players form with error" do
        post players_match_path(match), params: { player_ids: [ invalid_player.id ] }
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end
end
