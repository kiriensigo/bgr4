Rails.application.routes.draw do
  # Deviseのルートを制限して、omniauth_callbacksのみを使用
  devise_for :users, skip: [:sessions], controllers: { 
    omniauth_callbacks: 'auth/omniauth_callbacks' 
  }

  # セッション関連のルートを手動で定義
  as :user do
    get 'signin', to: 'devise/sessions#new', as: :new_user_session
    post 'signin', to: 'devise/sessions#create', as: :user_session
    delete 'signout', to: 'devise/sessions#destroy', as: :destroy_user_session
  end

  # コールバック用のルートを追加
  get '/auth/callback', to: 'auth/omniauth_callbacks#callback'
  get '/auth/failure', to: 'auth/omniauth_callbacks#failure'
  get '/auth/:provider', to: 'auth/omniauth_callbacks#passthru'
  get '/auth/:provider/callback', to: 'auth/omniauth_callbacks#callback'

  # API routes
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
end