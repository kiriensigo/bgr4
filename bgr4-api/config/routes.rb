Rails.application.routes.draw do
  namespace :admin do
    resources :mappings, only: [:index] do
      collection do
        put 'update'
      end
    end
  end
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
          get 'basic'              # 基本情報のみ取得
          get 'statistics'         # 統計情報のみ取得
          get 'reviews'           # レビューのみ取得
          get 'related'           # 関連ゲーム情報のみ取得
          get 'image_and_title'   # 画像とタイトルのみ取得（最高速）
          get 'specs'             # 基本スペック情報のみ取得
          get 'description'       # 説明文のみ取得
          patch 'update_japanese_name'
          get 'edit_histories'
          put 'update_from_bgg'  # BGGからゲーム情報を更新するルート
          put 'update_system_reviews' # システムレビューを更新するルート
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
      
      # 管理者専用ルート
      namespace :admin do
        post 'register_bgg_top_1000', to: 'admin#register_bgg_top_1000'
        get 'bgg_registration_status', to: 'admin#bgg_registration_status'
        get 'system_reviews_stats', to: 'admin#system_reviews_stats'
        get 'database_stats', to: 'admin#database_stats'
        post 'bulk_update_games', to: 'admin#bulk_update_games'
      end
    end
  end

  # letter_opener_web
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?

  get "/health", to: "health#show"
end