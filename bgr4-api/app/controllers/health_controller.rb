class HealthController < ApplicationController
  # CSRF保護を無効化（ヘルスチェック専用）
  skip_before_action :verify_authenticity_token, if: :json_request?
  
  def check
    # 基本的なヘルスチェック
    respond_to do |format|
      format.json { render json: { status: 'ok', timestamp: Time.current } }
      format.html { render plain: 'OK' }
    end
  end

  private

  def json_request?
    request.format.json?
  end
end
