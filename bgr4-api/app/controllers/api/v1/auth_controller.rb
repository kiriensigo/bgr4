module Api
  module V1
    class AuthController < ApplicationController
      def signup
        user = User.new(user_params)
        
        if user.save
          token = JWT.encode(
            { user_id: user.id, exp: 24.hours.from_now.to_i },
            Rails.application.credentials.secret_key_base,
            'HS256'
          )
          
          render json: {
            message: 'ユーザー登録が完了しました',
            token: token,
            user: user.as_json(except: :password_digest)
          }, status: :created
        else
          render json: { 
            error: user.errors.full_messages.join(', ') 
          }, status: :unprocessable_entity
        end
      end

      def login
        user = User.find_by(email: params[:email]&.downcase)
        
        if user&.authenticate(params[:password])
          token = JWT.encode(
            { 
              user_id: user.id,
              email: user.email,
              exp: 24.hours.from_now.to_i 
            },
            Rails.application.credentials.secret_key_base,
            'HS256'
          )
          
          render json: { 
            token: token,
            user: {
              id: user.id,
              email: user.email
            }
          }
        else
          render json: { error: 'メールアドレスまたはパスワードが正しくありません' }, status: :unauthorized
        end
      end

      private

      def user_params
        params.require(:user).permit(
          :name,
          :email,
          :password,
          :password_confirmation
        )
      end
    end
  end
end 