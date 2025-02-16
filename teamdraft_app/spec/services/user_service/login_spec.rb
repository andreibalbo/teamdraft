require 'rails_helper'

RSpec.describe UserService::Login do
  let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

  describe '#call' do
    context 'with valid credentials' do
      let(:params) { { email: user.email, password: 'password123' } }

      it 'returns success with user' do
        result = described_class.new(params).call
        expect(result).to eq({ success: true, user: user })
      end
    end

    context 'with invalid password' do
      let(:params) { { email: user.email, password: 'wrong_password' } }

      it 'returns failure' do
        result = described_class.new(params).call
        expect(result).to eq({ success: false, user: user })
      end
    end

    context 'with non-existent email' do
      let(:params) { { email: 'nonexistent@example.com', password: 'password123' } }

      it 'returns failure' do
        result = described_class.new(params).call
        expect(result).to eq({ success: false, user: nil })
      end
    end
  end
end
