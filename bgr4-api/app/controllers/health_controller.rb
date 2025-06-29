class HealthController < ApplicationController
  def check
    # 基本的なヘルスチェック
    respond_to do |format|
      format.json { render json: { status: 'ok', timestamp: Time.current } }
      format.html { render plain: 'OK' }
    end
  end
end
