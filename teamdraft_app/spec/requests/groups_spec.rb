require 'rails_helper'

RSpec.describe "Groups", type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:valid_attributes) { attributes_for(:group) }
  let(:invalid_attributes) { { name: '', category: 'invalid' } }

  before do
    post "/login", params: { email: user.email, password: user.password }
  end

  describe "GET /groups" do
    it "returns only groups the user is member of" do
      user_group = create(:group)
      other_group = create(:group)
      create(:membership, user: user, group: user_group)

      get "/groups"
      expect(response.body).to include(user_group.name)
      expect(response.body).not_to include(other_group.name)
    end

    it "shows the user's role in each group" do
      group = create(:group)
      create(:membership, :admin, user: user, group: group)

      get "/groups"
      expect(response.body).to include("admin")
    end
  end

  describe "GET /groups/:id" do
    context "when user is a member" do
      let(:group) { create(:group) }

      before do
        create(:membership, user: user, group: group)
      end

      it "shows group details" do
        get group_path(group)
        expect(response).to have_http_status(:success)
        expect(response.body).to include(group.name)
      end

      it "shows all members and their roles" do
        admin = create(:user)
        create(:membership, :admin, user: admin, group: group)

        get group_path(group)
        expect(response.body).to include(user.email)
        expect(response.body).to include(admin.email)
        expect(response.body).to include("admin")
        expect(response.body).to include("member")
      end
    end

    context "when user is not a member" do
      it "redirects to root with error" do
        group = create(:group)
        get group_path(group)
        expect(response).to redirect_to(groups_path)
        expect(flash[:alert]).to eq("You don't have permission to view this group")
      end
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
      it "creates a new group and adds creator as admin" do
        expect {
          post groups_url, params: { group: valid_attributes }
        }.to change(Group, :count).by(1)
        .and change(Membership, :count).by(1)

        group = Group.last
        membership = Membership.last
        expect(membership.user).to eq(user)
        expect(membership.group).to eq(group)
        expect(membership.role).to eq("admin")
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
    context "when user is admin" do
      let(:group) { create(:group) }

      before do
        create(:membership, :admin, user: user, group: group)
      end

      it "allows access to edit page" do
        get edit_group_path(group)
        expect(response).to have_http_status(:success)
      end
    end

    context "when user is regular member" do
      let(:group) { create(:group) }

      before do
        create(:membership, user: user, group: group)
      end

      it "redirects to root with error" do
        get edit_group_path(group)
        expect(response).to redirect_to(groups_path)
        expect(flash[:alert]).to eq("You don't have permission to edit this group")
      end
    end
  end

  describe "PATCH /groups/:id" do
    context "when user is admin" do
      let(:group) { create(:group) }

      before do
        create(:membership, :admin, user: user, group: group)
      end

      it "updates the group" do
        patch group_path(group), params: { group: { name: "New Name" } }
        expect(group.reload.name).to eq("New Name")
        expect(response).to redirect_to(group_path(group))
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
  end

  describe "DELETE /groups/:id" do
    context "when user is admin" do
      let(:group) { create(:group) }

      before do
        create(:membership, :admin, user: user, group: group)
      end

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

    context "when user is regular member" do
      let(:group) { create(:group) }

      before do
        create(:membership, user: user, group: group)
      end

      it "does not destroy the group" do
        expect {
          delete group_path(group)
        }.not_to change(Group, :count)
      end

      it "redirects to groups list path with error" do
        delete group_path(group)
        expect(response).to redirect_to(groups_path)
        expect(flash[:alert]).to eq("You don't have permission to delete this group")
      end
    end

    context "when user is not a member" do
      let(:group) { create(:group) }

      it "redirects to groups list path with error" do
        delete group_path(group)
        expect(response).to redirect_to(groups_path)
        expect(flash[:alert]).to eq("You don't have permission to delete this group")
      end
    end
  end
end
