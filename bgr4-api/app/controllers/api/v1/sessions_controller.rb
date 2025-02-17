module Api
  module V1
    class SessionsController < ApplicationController
      def create
        user = User.find_by(email: params[:email])
        if user&.valid_password?(params[:password])
          sign_in user
          render json: {
            status: 'success',
            message: 'ログインに成功しました',
            data: {
              user: {
                id: user.id,
                name: user.name,
                email: user.email
              }
            }
          }
        else
          render json: {
            status: 'error',
            message: 'メールアドレスまたはパスワードが正しくありません'
          }, status: :unauthorized
        end
      end

      def destroy
        sign_out current_user
        render json: {
          status: 'success',
          message: 'ログアウトしました'
        }
      end
    end
  end
end 