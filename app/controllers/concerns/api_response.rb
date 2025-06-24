# frozen_string_literal: true

module ApiResponse
  extend ActiveSupport::Concern
  
  # 成功レスポンス
  def success_response(data = nil, message = nil, status = :ok)
    response = {}
    response[:success] = true
    response[:message] = message if message
    response[:data] = data if data
    
    render json: response, status: status
  end
  
  # エラーレスポンス
  def error_response(message, status = :bad_request, details = nil)
    response = {
      success: false,
      error: message
    }
    response[:details] = details if details
    
    render json: response, status: status
  end
  
  # ページネーション付きレスポンス
  def paginated_response(items, total_count, page, per_page, message = nil)
    total_pages = (total_count.to_f / per_page).ceil
    
    response = {
      success: true,
      data: items,
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: total_pages,
        has_next_page: page < total_pages,
        has_prev_page: page > 1
      }
    }
    response[:message] = message if message
    
    render json: response
  end
  
  # バリデーションエラーレスポンス
  def validation_error_response(model)
    error_response(
      "バリデーションエラーが発生しました", 
      :unprocessable_entity,
      model.errors.as_json
    )
  end
  
  # 認証エラーレスポンス
  def unauthorized_response(message = "認証が必要です")
    error_response(message, :unauthorized)
  end
  
  # 権限エラーレスポンス  
  def forbidden_response(message = "権限がありません")
    error_response(message, :forbidden)
  end
  
  # 404エラーレスポンス
  def not_found_response(resource = "リソース")
    error_response("#{resource}が見つかりません", :not_found)
  end
end 