Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :games, only: [:index, :show] do
        collection do
          get 'search'
        end
        resources :reviews, only: [:index, :create, :update]
      end
      resources :users, only: [:create]
      post '/login', to: 'sessions#create'
      delete '/logout', to: 'sessions#destroy'
      post 'auth/login', to: 'auth#login'
      post 'auth/signup', to: 'auth#signup'
      resources :reviews, only: [] do
        collection do
          get :all
        end
      end
    end
  end

  # OmniAuth用のルーティング
  get '/auth/google_oauth2/callback', to: 'auth/omniauth_callbacks#callback'
  get '/auth/failure', to: 'auth/omniauth_callbacks#failure'
  get '/auth/google', to: 'auth/omniauth_callbacks#passthru'
end