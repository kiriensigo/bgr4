class Auth::SessionsController < ApplicationController
  def create
    token = encode_token(user_id: @user.id)
    session[:user_token] = token
    
    # セッションのセキュリティ設定
    session.options[:secure] = Rails.env.production?
    session.options[:same_site] = :strict
    
    render json: { token: token }
  end

  def destroy
    session.delete(:user_token)
    render json: { message: 'ログアウトしました' }
  end
end 