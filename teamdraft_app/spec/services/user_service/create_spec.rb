require 'rails_helper'

RSpec.describe UserService::Create do
  describe '#call' do
    context 'with valid parameters' do
      let(:valid_params) do
        {
          email: "test@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      end

      it 'creates a new user' do
        expect {
          described_class.new(valid_params).call
        }.to change(User, :count).by(1)
      end

      it 'returns success with the created user' do
        result = described_class.new(valid_params).call
        expect(result[:success]).to be true
        expect(result[:user]).to be_persisted
        expect(result[:user].email).to eq("test@example.com")
      end
    end

    context 'with invalid parameters' do
      context 'with invalid email' do
        let(:invalid_email_params) do
          {
            email: "invalid-email",
            password: "password123",
            password_confirmation: "password123"
          }
        end

        it 'does not create a user' do
          expect {
            described_class.new(invalid_email_params).call
          }.not_to change(User, :count)
        end

        it 'returns failure with the invalid user' do
          result = described_class.new(invalid_email_params).call
          expect(result[:success]).to be false
          expect(result[:user]).not_to be_persisted
          expect(result[:user].errors[:email]).to be_present
        end
      end

      context 'with mismatched passwords' do
        let(:mismatched_password_params) do
          {
            email: "test@example.com",
            password: "password123",
            password_confirmation: "different123"
          }
        end

        it 'returns failure with password confirmation error' do
          result = described_class.new(mismatched_password_params).call
          expect(result[:success]).to be false
          expect(result[:user].errors[:password_confirmation]).to be_present
        end
      end

      context 'with duplicate email' do
        before do
          create(:user, email: "test@example.com")
        end

        let(:duplicate_email_params) do
          {
            email: "test@example.com",
            password: "password123",
            password_confirmation: "password123"
          }
        end

        it 'returns failure with uniqueness error' do
          result = described_class.new(duplicate_email_params).call
          expect(result[:success]).to be false
          expect(result[:user].errors[:email]).to include("has already been taken")
        end
      end
    end
  end
end
