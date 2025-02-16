require 'rails_helper'

RSpec.describe "Users", type: :request do
  describe "GET /users/new" do
    context "when not logged in" do
      it "returns http success" do
        get "/signup"
        expect(response).to have_http_status(:success)
      end

      it "can render the form" do
        get "/signup"
        expect(response.body).to include('form')
      end
    end

    context "when already logged in" do
      let(:user) { create(:user) }

      before do
        post "/login", params: {
          email: user.email,
          password: user.password
        }
      end

      it "redirects to root path" do
        get "/signup"
        expect(response).to redirect_to(root_path)
      end
    end
  end

  describe "POST /users" do
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
          post "/users", params: valid_params
        }.to change(User, :count).by(1)
      end

      it "logs in the user" do
        post "/users", params: valid_params
        expect(session[:user_id]).not_to be_nil
      end

      it "redirects to root with success notice" do
        post "/users", params: valid_params
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
          post "/users", params: invalid_params
        }.not_to change(User, :count)
      end

      it "renders new template with unprocessable_entity status" do
        post "/users", params: invalid_params
        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.body).to include('form') # Verifying the form is re-rendered
      end
    end
  end
end
