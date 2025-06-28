module Auth
  class ConfirmationsController < DeviseTokenAuth::ConfirmationsController
    include DeviseTokenAuth::Concerns::SetUserByToken

    def show
      @resource = resource_class.confirm_by_token(params[:confirmation_token])

      if @resource.errors.empty?
        # トークン生成のヘルパーメソッドを使用
        token = @resource.create_new_auth_token

        # フロントエンドのコールバックページにリダイレクト
        redirect_to(
          "#{ENV['FRONTEND_URL']}/auth/callback?" + {
            'access-token': token['access-token'],
            'client': token['client'],
            'uid': token['uid'],
            'expiry': token['expiry'],
            'success': true
          }.to_query,
          allow_other_host: true
        ) and return
      else
        # エラーがある場合
        error_message = resource_errors.join(', ')
        redirect_to(
          "#{ENV['FRONTEND_URL']}/login?error=#{CGI.escape(error_message)}",
          allow_other_host: true
        ) and return
      end
    rescue StandardError => e
      Rails.logger.error "Confirmation error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      redirect_to(
        "#{ENV['FRONTEND_URL']}/login?error=#{CGI.escape('アカウントの確認中にエラーが発生しました')}",
        allow_other_host: true
      ) and return
    end

    private

    def resource_errors
      @resource.errors.full_messages.map { |msg| translate_error(msg) }
    end

    def translate_error(message)
      case message
      when "Confirmation token is invalid"
        "確認トークンが無効です"
      else
        message
      end
    end
  end
end 