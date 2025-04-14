require 'rufus-scheduler'

# 本番環境でのみスケジューラを実行
if Rails.env.production? && ENV["DISABLE_SCHEDULER"] != "true"
  Rails.logger.info "Initializing Rufus Scheduler"
  
  scheduler = Rufus::Scheduler.singleton
  
  # アプリケーション起動時に一度だけ実行
  scheduler.in '5m' do
    Rails.logger.info "Running initial FetchPopularGamesJob"
    FetchPopularGamesJob.perform_later(100) # 上位100件の人気ゲームを取得
  end
  
  # 毎日午前3時にBGGの人気ゲームを取得
  scheduler.cron '0 3 * * *' do
    Rails.logger.info "Running daily FetchPopularGamesJob"
    FetchPopularGamesJob.perform_later(50) # 上位50件の人気ゲームを取得
  end
  
  # 毎週月曜日の午前4時にシステムレビューを更新
  scheduler.cron '0 4 * * 1' do
    Rails.logger.info "Running weekly UpdateSystemReviewsJob"
    UpdateSystemReviewsJob.perform_later
  end
  
  # 毎月1日の午前5時にデータベースのメンテナンス
  scheduler.cron '0 5 1 * *' do
    Rails.logger.info "Running monthly database maintenance"
    ActiveRecord::Base.connection.execute("VACUUM ANALYZE;")
  end
  
  Rails.logger.info "Rufus Scheduler initialized with #{scheduler.jobs.size} jobs"
else
  Rails.logger.info "Rufus Scheduler disabled in #{Rails.env} environment or by DISABLE_SCHEDULER flag"
end 