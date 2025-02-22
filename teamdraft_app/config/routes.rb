Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Authentication routes
  get "/login" => "sessions#new", as: :login
  post "/login" => "sessions#create"
  delete "/logout" => "sessions#destroy", as: :logout

  get "/signup" => "users#new", as: :signup
  post "/users" => "users#create"

  resources :groups do
    resources :players, shallow: true
    resources :matches, shallow: true
  end

  resources :matches do
    get "players", on: :member
    post "players", to: "matches#update_players", on: :member
    resources :drafts, only: [ :destroy ] do
      post :generate, on: :collection
    end
  end

  resources :drafts, only: [ :show ]

  root to: "home#index"
end
