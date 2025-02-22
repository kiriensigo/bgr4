module Auth
  class SessionsController < DeviseTokenAuth::SessionsController
    include ActionController::RequestForgeryProtection
    protect_from_forgery with: :null_session
    skip_before_action :verify_authenticity_token, raise: false

    def new
      # GETリクエストの場合は、フロントエンドのログインページにリダイレクト
      frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:3001'
      redirect_to "#{frontend_url}/login"
    end

    def create
      # アカウントが有効化されているかチェック
      resource = User.find_by(email: params[:email])
      if resource && !resource.confirmed?
        render json: {
          errors: ['アカウントが有効化されていません。メールを確認して登録を完了してください']
        }, status: :unauthorized
        return
      end

      super
    end

    def render_create_success
      render json: {
        data: @resource.as_json(except: [:tokens, :created_at, :updated_at]),
        message: 'ログインしました'
      }
    end

    def render_create_error_bad_credentials
      render json: {
        errors: ['メールアドレスまたはパスワードが正しくありません']
      }, status: :unauthorized
    end

    def render_destroy_success
      render json: {
        message: 'ログアウトしました'
      }
    end

    private

    def resource_params
      params.permit(:email, :password)
    end
  end
end 