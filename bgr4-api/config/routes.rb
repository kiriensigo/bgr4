Rails.application.routes.draw do
  # devise_token_authのルートを設定
  mount_devise_token_auth_for 'User', at: 'auth', controllers: {
    registrations: 'auth/registrations',
    sessions: 'auth/sessions',
    omniauth_callbacks: 'auth/omniauth_callbacks',
    confirmations: 'auth/confirmations'
  }

  # 追加のOmniAuthルート
  devise_scope :user do
    # OmniAuthのコールバック
    get '/auth/:provider', to: 'auth/omniauth_callbacks#passthru'
    get '/auth/:provider/callback', to: 'auth/omniauth_callbacks#omniauth_success'
    post '/auth/:provider/callback', to: 'auth/omniauth_callbacks#omniauth_success'
    get '/auth/failure', to: 'auth/omniauth_callbacks#omniauth_failure'
    
    # Twitter2用の追加ルート
    get '/omniauth/twitter2', to: 'auth/omniauth_callbacks#passthru'
    get '/auth/twitter2/callback', to: 'auth/omniauth_callbacks#omniauth_success'
  end

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

  # letter_opener_web
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?
end