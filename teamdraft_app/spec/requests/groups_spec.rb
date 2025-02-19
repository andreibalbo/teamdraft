require 'rails_helper'

RSpec.describe "Groups", type: :request do
  let(:user) { create(:user) }
  let(:valid_attributes) { attributes_for(:group) }
  let(:invalid_attributes) { { name: '', category: 'invalid' } }

  before do
    post "/login", params: { email: user.email, password: user.password }
  end

  describe "GET /groups" do
    it "returns http success" do
      get "/groups"
      expect(response).to have_http_status(:success)
    end

    it "displays all groups" do
      group = create(:group)
      get "/groups"
      expect(response.body).to include(group.name)
    end
  end

  describe "GET /groups/:id" do
    let(:group) { create(:group) }

    it "returns http success" do
      get group_path(group)
      expect(response).to have_http_status(:success)
    end

    it "displays group details" do
      get group_path(group)
      expect(response.body).to include(group.name)
      expect(response.body).to include(group.category)
      expect(response.body).to include(group.description)
    end
  end

  describe "GET /groups/new" do
    it "returns http success" do
      get new_group_path
      expect(response).to have_http_status(:success)
    end

    it "displays the new group form" do
      get new_group_path
      expect(response.body).to include('form')
    end
  end

  describe "POST /groups" do
    context "with valid parameters" do
      it "creates a new Group" do
        expect {
          post groups_path, params: { group: valid_attributes }
        }.to change(Group, :count).by(1)
      end

      it "redirects to the created group" do
        post groups_path, params: { group: valid_attributes }
        expect(response).to redirect_to(group_path(Group.last))
      end

      it "sets a success notice" do
        post groups_path, params: { group: valid_attributes }
        expect(flash[:notice]).to eq("Group was successfully created.")
      end
    end

    context "with invalid parameters" do
      it "does not create a new Group" do
        expect {
          post groups_path, params: { group: invalid_attributes }
        }.not_to change(Group, :count)
      end

      it "renders the new template" do
        post groups_path, params: { group: invalid_attributes }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.body).to include('form')
      end
    end
  end

  describe "GET /groups/:id/edit" do
    let(:group) { create(:group) }

    it "returns http success" do
      get edit_group_path(group)
      expect(response).to have_http_status(:success)
    end

    it "displays the edit form" do
      get edit_group_path(group)
      expect(response.body).to include('form')
    end
  end

  describe "PATCH /groups/:id" do
    let(:group) { create(:group) }
    let(:new_attributes) { { name: "Updated Name" } }

    context "with valid parameters" do
      it "updates the requested group" do
        patch group_path(group), params: { group: new_attributes }
        group.reload
        expect(group.name).to eq("Updated Name")
      end

      it "redirects to the group" do
        patch group_path(group), params: { group: new_attributes }
        expect(response).to redirect_to(group_path(group))
      end

      it "sets a success notice" do
        patch group_path(group), params: { group: new_attributes }
        expect(flash[:notice]).to eq("Group was successfully updated.")
      end
    end

    context "with invalid parameters" do
      it "does not update the group" do
        original_name = group.name
        patch group_path(group), params: { group: invalid_attributes }
        group.reload
        expect(group.name).to eq(original_name)
      end

      it "renders the edit template" do
        patch group_path(group), params: { group: invalid_attributes }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.body).to include('form')
      end
    end
  end

  describe "DELETE /groups/:id" do
    let!(:group) { create(:group) }

    it "destroys the requested group" do
      expect {
        delete group_path(group)
      }.to change(Group, :count).by(-1)
    end

    it "redirects to the groups list" do
      delete group_path(group)
      expect(response).to redirect_to(groups_url)
    end

    it "sets a success notice" do
      delete group_path(group)
      expect(flash[:notice]).to eq("Group was successfully deleted.")
    end
  end
end
