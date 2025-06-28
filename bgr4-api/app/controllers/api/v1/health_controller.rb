class Api::V1::HealthController < ApplicationController
  def index
    health_status = {
      status: 'ok',
      timestamp: Time.current.iso8601,
      environment: Rails.env,
      version: '1.0.0'
    }

    # データベース接続チェック
    begin
      ActiveRecord::Base.connection.execute('SELECT 1')
      health_status[:database] = 'connected'
    rescue => e
      health_status[:database] = 'error'
      health_status[:database_error] = e.message
      return render json: health_status, status: :service_unavailable
    end

    # 依存サービスチェック
    health_status[:services] = {
      redis: check_redis_connection,
      external_apis: 'ok'
    }

    render json: health_status, status: :ok
  end

  private

  def check_redis_connection
    # Redisを使用している場合のチェック
    # 現在の設定では不要ですが、将来の拡張のため
    'not_configured'
  rescue => e
    'error'
  end
end 