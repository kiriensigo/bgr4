class RegisterBggTop1000Job < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info "RegisterBggTop1000Job を開始しました"
    
    begin
      # Rakeタスクを実行
      system("cd #{Rails.root} && bundle exec rake bgg:register_top_1000")
      
      Rails.logger.info "RegisterBggTop1000Job が正常に完了しました"
      
    rescue => e
      Rails.logger.error "RegisterBggTop1000Job でエラーが発生しました: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise e
    end
  end
end
