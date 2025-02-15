require 'rails_helper'

RSpec.describe SessionsController, type: :controller do
  let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

  describe "GET #new" do
    it "returns http success" do
      get :new
      expect(response).to have_http_status(:success)
    end
  end

  describe 'POST #create' do
    context 'with valid credentials' do
      it 'creates a new session and redirects' do
        post :create, params: { email: user.email, password: 'password123' }

        expect(session[:user_id]).to eq(user.id)
        expect(response).to redirect_to(root_url)
        expect(flash[:notice]).to eq('Logged in successfully!')
      end
    end

    context 'with invalid credentials' do
      it 'returns to login form with error' do
        post :create, params: { email: user.email, password: 'wrong_password' }

        expect(session[:user_id]).to be_nil
        expect(response).to have_http_status(:unprocessable_entity)
        expect(flash.now[:alert]).to eq('Invalid email or password')
      end
    end
  end

  describe 'DELETE #destroy' do
    before { session[:user_id] = user.id }

    it 'logs out the user' do
      delete :destroy

      expect(session[:user_id]).to be_nil
      expect(response).to redirect_to(root_url)
      expect(flash[:notice]).to eq('Logged out successfully!')
    end
  end
end
