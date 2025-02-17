module Auth
  class ConfirmationsController < DeviseTokenAuth::ConfirmationsController
    def show
      @resource = resource_class.confirm_by_token(params[:confirmation_token])

      if @resource.errors.empty?
        @resource.save!
        yield @resource if block_given?

        redirect_url = ENV['FRONTEND_URL'] || 'http://localhost:3001'
        redirect_to "#{redirect_url}?account_confirmation_success=true", allow_other_host: true
      else
        redirect_url = ENV['FRONTEND_URL'] || 'http://localhost:3001'
        redirect_to "#{redirect_url}?account_confirmation_error=true", allow_other_host: true
      end
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