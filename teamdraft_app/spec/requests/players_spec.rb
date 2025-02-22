require 'rails_helper'

RSpec.describe "Players", type: :request do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let!(:player) { create(:player, group: group) }

  before do
    post "/login", params: { email: user.email, password: user.password }
  end

  describe "GET /groups/:group_id/players" do
    it "returns http success" do
      get group_players_path(group)
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /players/:id" do
    it "returns http success" do
      get player_path(player)
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /groups/:group_id/players/new" do
    it "returns http success" do
      get new_group_player_path(group)
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /groups/:group_id/players" do
    let(:valid_params) do
      {
        player: {
          name: "New Player",
          positioning: 50,
          defense: 70,
          attack: 80,
          stamina: 90
        }
      }
    end

    context "with valid parameters" do
      it "creates a new player" do
        expect {
          post group_players_path(group), params: valid_params
        }.to change(Player, :count).by(1)

        expect(response).to redirect_to(player_path(Player.last))
      end
    end

    context "with invalid parameters" do
      it "does not create a player" do
        expect {
          post group_players_path(group), params: { player: { name: "" } }
        }.not_to change(Player, :count)

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "GET /players/:id/edit" do
    it "returns http success" do
      get edit_player_path(player)
      expect(response).to have_http_status(:success)
    end
  end

  describe "PATCH /players/:id" do
    context "with valid parameters" do
      it "updates the player" do
        patch player_path(player), params: { player: { name: "Updated Name" } }

        expect(player.reload.name).to eq("Updated Name")
        expect(response).to redirect_to(player_path(player))
      end
    end

    context "with invalid parameters" do
      it "does not update the player" do
        patch player_path(player), params: { player: { name: "" } }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "DELETE /players/:id" do
    it "destroys the player" do
      expect {
        delete player_path(player)
      }.to change(Player, :count).by(-1)

      expect(response).to redirect_to(group_players_path(group))
    end
  end
end
