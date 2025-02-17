module Auth
  class SessionsController < DeviseTokenAuth::SessionsController
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
  end
end 