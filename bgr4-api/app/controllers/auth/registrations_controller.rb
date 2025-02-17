module Auth
  class RegistrationsController < DeviseTokenAuth::RegistrationsController
    def create
      build_resource

      if @resource.save
        yield @resource if block_given?

        unless @resource.confirmed?
          # 確認メールのリダイレクトURLを設定
          @redirect_url = ENV['FRONTEND_URL'] || "http://localhost:3001"

          # 確認メールを送信（一度だけ）
          @resource.send_confirmation_instructions(redirect_url: @redirect_url)

          render json: {
            status: 'success',
            data: @resource.as_json(except: [:tokens, :created_at, :updated_at]),
            message: '確認メールを送信しました。メールを確認して登録を完了してください'
          }
        else
          render_create_success
        end
      else
        clean_up_passwords @resource
        render_create_error
      end
    rescue => e
      Rails.logger.error "Registration Error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: {
        status: 'error',
        errors: ['予期せぬエラーが発生しました。もう一度お試しください。']
      }, status: :internal_server_error
    end

    def update
      if account_update_params[:password].blank?
        account_update_params.delete(:password)
        account_update_params.delete(:password_confirmation)
      end

      if @resource.update(account_update_params)
        render json: {
          status: 'success',
          data: @resource.as_json(except: [:tokens, :created_at, :updated_at]),
          message: 'プロフィールを更新しました'
        }
      else
        render json: {
          status: 'error',
          errors: @resource.errors.full_messages.map { |msg| translate_error(msg) }
        }, status: :unprocessable_entity
      end
    end

    protected

    def build_resource
      @resource = resource_class.new(sign_up_params)
      @resource.provider = 'email'
      @resource.uid = @resource.email if @resource.uid.blank?
      @resource
    end

    private

    def sign_up_params
      params.permit(:name, :email, :password, :password_confirmation)
    end

    def account_update_params
      params.permit(:name, :email, :password, :password_confirmation, :current_password)
    end

    def render_create_success
      render json: {
        status: 'success',
        data: @resource.as_json(except: [:tokens, :created_at, :updated_at]),
        message: '新規登録が完了しました'
      }
    end

    def render_create_error
      render json: {
        status: 'error',
        errors: resource_errors
      }, status: :unprocessable_entity
    end

    def resource_errors
      @resource.errors.full_messages.map { |msg| translate_error(msg) }
    end

    def translate_error(message)
      case message
      when "Name can't be blank"
        "名前を入力してください"
      when "Email can't be blank"
        "メールアドレスを入力してください"
      when "Email is invalid"
        "メールアドレスが無効です"
      when "Email has already been taken"
        "このメールアドレスは既に使用されています"
      when "Password can't be blank"
        "パスワードを入力してください"
      when "Password is too short"
        "パスワードが短すぎます"
      when "Password confirmation doesn't match Password"
        "パスワードが一致しません"
      when "Current password is invalid"
        "現在のパスワードが正しくありません"
      when "A confirmation email was sent to your account"
        "確認メールを送信しました。メールの指示に従ってアカウントを有効化してください"
      else
        message
      end
    end
  end
end 