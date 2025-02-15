require 'rails_helper'

RSpec.describe "Sessions", type: :request do
  describe "GET /login" do
    it "returns http success" do
      get "/login"
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /login" do
    let(:user) { create(:user, email: "test@example.com", password: "password123") }

    context "with valid credentials" do
      it "logs in the user" do
        post "/login", params: { email: user.email, password: "password123" }
        expect(session[:user_id]).to eq(user.id)
      end

      it "redirects to root with success notice" do
        post "/login", params: { email: user.email, password: "password123" }
        expect(response).to redirect_to(root_url)
        expect(flash[:notice]).to eq("Logged in successfully!")
      end
    end

    context "with invalid credentials" do
      it "does not log in the user" do
        post "/login", params: { email: user.email, password: "wrong_password" }
        expect(session[:user_id]).to be_nil
      end

      it "renders login form with error" do
        post "/login", params: { email: user.email, password: "wrong_password" }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(flash.now[:alert]).to eq("Invalid email or password")
      end
    end
  end

  describe "DELETE /logout" do
    let(:user) { create(:user) }

    before do
      post "/login", params: { email: user.email, password: user.password }
    end

    it "logs out the user" do
      delete "/logout"
      expect(session[:user_id]).to be_nil
    end

    it "redirects to root with notice" do
      delete "/logout"
      expect(response).to redirect_to(root_url)
      expect(flash[:notice]).to eq("Logged out successfully!")
    end
  end
end
