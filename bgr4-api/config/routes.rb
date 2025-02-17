Rails.application.routes.draw do
  # devise_token_authのルートを設定
  mount_devise_token_auth_for 'User', at: 'auth', controllers: {
    registrations: 'auth/registrations',
    sessions: 'auth/sessions',
    omniauth_callbacks: 'auth/omniauth_callbacks',
    confirmations: 'auth/confirmations'
  }

  # letter_opener_web
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?

  # API routes
  namespace :api do
    namespace :v1 do
      resources :games, only: [:index, :show, :create] do
        collection do
          get 'search'
        end
        resources :reviews, only: [:index, :create, :update]
      end
      
      resources :reviews, only: [] do
        collection do
          get :all
          get :my
        end
      end
    end
  end
end