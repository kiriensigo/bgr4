Rails.application.routes.draw do
  # 既存のルーティング

  namespace :api do
    namespace :v1 do
      resources :games, only: [:index, :show] do
        resources :reviews, only: [:create]
      end
    end
  end
end

