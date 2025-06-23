# frozen_string_literal: true

module ApiPagination
  extend ActiveSupport::Concern
  
  private
  
  # ページネーション パラメータを取得・検証
  def pagination_params
    page = params[:page].present? ? [params[:page].to_i, 1].max : 1
    per_page = params[:per_page].present? ? params[:per_page].to_i : 24
    
    # per_pageの上限を設定（DoS攻撃防止）
    per_page = [per_page, 100].min
    
    { page: page, per_page: per_page }
  end
  
  # Active Record リレーションにページネーションを適用
  def paginate(relation)
    pagination = pagination_params
    
    {
      items: relation.limit(pagination[:per_page])
                    .offset((pagination[:page] - 1) * pagination[:per_page]),
      total_count: relation.count,
      page: pagination[:page],
      per_page: pagination[:per_page]
    }
  end
  
  # ページネーション メタデータを作成
  def pagination_meta(total_count, page, per_page)
    total_pages = (total_count.to_f / per_page).ceil
    
    {
      current_page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: total_pages,
      has_next_page: page < total_pages,
      has_prev_page: page > 1,
      next_page: page < total_pages ? page + 1 : nil,
      prev_page: page > 1 ? page - 1 : nil
    }
  end
end 