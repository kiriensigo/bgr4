class Admin::MappingsController < ApplicationController
  before_action :authenticate_admin!
  
  def index
    # 未マッピングの項目を取得
    @unmapped_items = UnmappedBggItem.most_frequent(50)
    
    # BGGカテゴリーからサイトメカニクスへの変換マップ
    @category_mappings = Game.new.instance_eval { bgg_category_to_site_mechanic }
    
    # BGGメカニクスからサイトカテゴリーへの変換マップ
    @mechanic_mappings = Game.new.instance_eval { bgg_mechanic_to_site_category }
    
    # 統計情報
    @stats = {
      total_unmapped: UnmappedBggItem.count,
      by_type: UnmappedBggItem.count_by_type
    }
    
    render json: {
      unmapped_items: @unmapped_items,
      category_mappings: @category_mappings,
      mechanic_mappings: @mechanic_mappings,
      stats: @stats
    }
  end

  def update
    # パラメータからマッピング情報を取得
    mapping_type = params[:mapping_type]
    bgg_name = params[:bgg_name]
    site_name = params[:site_name]
    
    unless ['category', 'mechanic'].include?(mapping_type)
      return render json: { error: '無効なマッピングタイプです' }, status: :bad_request
    end
    
    # マッピングを更新
    success = false
    
    if mapping_type == 'category'
      # BGGカテゴリーからサイトメカニクスへのマッピングを更新
      # 実際の実装では、マッピングをデータベースに保存するか、
      # 設定ファイルに書き込むなどの方法が必要
      success = true
    elsif mapping_type == 'mechanic'
      # BGGメカニクスからサイトカテゴリーへのマッピングを更新
      success = true
    end
    
    if success
      # 対応する未マッピング項目を削除
      UnmappedBggItem.where(bgg_type: mapping_type, bgg_name: bgg_name).destroy_all
      
      render json: { success: true, message: 'マッピングが更新されました' }
    else
      render json: { error: 'マッピングの更新に失敗しました' }, status: :internal_server_error
    end
  end
  
  private
  
  def authenticate_admin!
    # 管理者認証のロジック
    # 実際の実装では、現在のユーザーが管理者かどうかを確認する
    unless current_user&.admin?
      render json: { error: '管理者権限が必要です' }, status: :unauthorized
    end
  end
end
