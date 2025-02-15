Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :games, only: [:index, :show] do
        resources :reviews, only: [:create, :index]
      end
      resources :users, only: [:create]
      post '/login', to: 'sessions#create'
      delete '/logout', to: 'sessions#destroy'
    end
  end
end