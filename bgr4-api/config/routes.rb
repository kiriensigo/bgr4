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
      resources :games, only: [:index, :show, :create, :update, :destroy] do
        collection do
          get 'search'
          get 'hot'
          get 'search_by_publisher'
          get 'search_by_designer'
        end
        member do
          patch 'update_japanese_name'
          get 'edit_histories'
          put 'update_from_bgg'  # BGGからゲーム情報を更新するルート
          get 'expansions'       # 拡張情報を取得するルート
          put 'update_expansions' # 拡張情報を更新するルート
        end
        resources :reviews, only: [:index, :create, :update]
      end
      
      resources :reviews, only: [] do
        member do
          post 'like'
          delete 'unlike'
        end
        collection do
          get 'all'
          get 'my'
        end
      end
      
      resources :wishlist_items, only: [:index, :create, :destroy] do
        collection do
          put 'reorder'
        end
      end
      
      resources :game_edit_histories, only: [:index]
      
      # ユーザー関連
      resources :users, only: [:show] do
        collection do
          get 'profile'
          put 'profile'
        end
        member do
          get 'reviews'
        end
      end
      
      # BGG関連
      get 'bgg/version_image', to: 'games#version_image'
    end
  end

  # letter_opener_web
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?
end