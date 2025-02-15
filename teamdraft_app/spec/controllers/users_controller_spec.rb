require 'rails_helper'

RSpec.describe UsersController, type: :controller do
  describe "GET #new" do
    context "when not logged in" do
      it "returns http success" do
        get :new
        expect(response).to have_http_status(:success)
      end

      it "assigns a new user" do
        get :new
        expect(assigns(:user)).to be_a_new(User)
      end
    end

    context "when already logged in" do
      let(:user) { create(:user) }

      before do
        session[:user_id] = user.id
      end

      it "redirects to root path" do
        get :new
        expect(response).to redirect_to(root_path)
      end
    end
  end

  describe "POST #create" do
    let(:valid_params) do
      {
        user: {
          email: "test@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      }
    end

    context "with valid parameters" do
      it "creates a new user" do
        expect {
          post :create, params: valid_params
        }.to change(User, :count).by(1)
      end

      it "sets the session" do
        post :create, params: valid_params
        expect(session[:user_id]).not_to be_nil
      end

      it "redirects to root with success notice" do
        post :create, params: valid_params
        expect(response).to redirect_to(root_url)
        expect(flash[:notice]).to eq("Account created successfully!")
      end
    end

    context "with invalid parameters" do
      let(:invalid_params) do
        {
          user: {
            email: "invalid-email",
            password: "pass",
            password_confirmation: "different"
          }
        }
      end

      it "does not create a new user" do
        expect {
          post :create, params: invalid_params
        }.not_to change(User, :count)
      end

      it "renders new template with unprocessable_entity status" do
        post :create, params: invalid_params
        expect(response).to render_template(:new)
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end
end
