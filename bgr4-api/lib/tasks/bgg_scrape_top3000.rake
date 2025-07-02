namespace :bgg do
  desc "Scrape BGG browse pages 11-30 (ranks 1001-3000) and export IDs to CSV"
  task scrape_top3000_with_browser: :environment do
    require 'csv'
    require 'puppeteer-ruby'

    output_dir = Rails.root.join('tmp')
    FileUtils.mkdir_p(output_dir)
    output_file = output_dir.join("bgg_1001_3000_ids_#{Time.current.strftime('%Y%m%d_%H%M%S')}.csv")

    puts "🕸  Puppeteer を使って BG​G ブラウズページ (11-30) をスクレイピングします…"

    game_ids = []

    username = ENV['BGG_USERNAME'] || 'muruken'
    password = ENV['BGG_PASSWORD'] || 'psotrial'

    Puppeteer.launch(headless: true, args: ['--no-sandbox']) do |browser|
      page = browser.new_page
      page.user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

      # --- 🛂 BGGにログイン ------------------------------------------------------
      puts "🔐 BGG にログインしています… (ユーザー: #{username})"

      begin
        page.goto('https://boardgamegeek.com/login', wait_until: 'networkidle0', timeout: 60_000)

        # ユーザー名入力
        begin
          page.wait_for_selector('input[name="username"], #inputUsername', timeout: 10_000)
          if page.query_selector('input[name="username"]')
            page.type('input[name="username"]', username, delay: 20)
          elsif page.query_selector('#inputUsername')
            page.type('#inputUsername', username, delay: 20)
          end
        rescue => e
          puts "⚠️ ユーザー名入力フィールドが見つかりません: #{e.message}"
        end

        # パスワード入力
        begin
          page.wait_for_selector('input[name="password"], #inputPassword', timeout: 10_000)
          if page.query_selector('input[name="password"]')
            page.type('input[name="password"]', password, delay: 20)
          elsif page.query_selector('#inputPassword')
            page.type('#inputPassword', password, delay: 20)
          end
        rescue => e
          puts "⚠️ パスワード入力フィールドが見つかりません: #{e.message}"
        end

        # 送信ボタンをクリック
        begin
          if page.query_selector('button[type="submit"]')
            page.click('button[type="submit"]')
          elsif page.query_selector('input[type="submit"]')
            page.click('input[type="submit"]')
          else
            # フォームが JS でハンドリングされる場合は Enter キー送信
            page.keyboard.press('Enter')
          end
        rescue => e
          puts "⚠️ ログイン送信時にエラー: #{e.message}"
        end

        # ナビゲーション完了待ち
        page.wait_for_navigation(wait_until: 'networkidle0', timeout: 60_000)
        puts "✅ ログイン成功 (たぶん)。続行します…"
      rescue => e
        puts "❌ ログインに失敗しました: #{e.message}"
        puts "    ログインせずに続行します (結果が取得できない可能性があります)"
      end

      # --- 📈 ランキングページ取得 ------------------------------------------------
      (11..30).each do |p|
        url = "https://boardgamegeek.com/browse/boardgame/page/#{p}?sort=rank&sortdir=asc"
        puts "📄 ページ #{p}: #{url}"

        begin
          page.goto(url, wait_until: 'domcontentloaded', timeout: 60_000)
          # ページが完全に描画されるまで待機
          page.wait_for_selector('table.collection_table', timeout: 20_000)

          rows = page.query_selector_all('tr[id^="row_"]')
          puts "   ➜ 行数: #{rows.length}"

          rows.each do |row|
            begin
              rank_text = row.eval_on_selector('td.collection_rank', 'el => el.textContent.trim()') rescue nil
              rank = rank_text.to_i
              next if rank <= 1000 # 念のためスキップ

              link_href = row.eval_on_selector('td.collection_objectname a', 'el => el.getAttribute("href")') rescue nil
              next unless link_href&.match(/\/boardgame\/(\d+)\//)
              bgg_id = $1.to_i
              game_ids << bgg_id unless game_ids.include?(bgg_id)
            rescue => e
              puts "      ⚠️ 行パースエラー: #{e.message}"
            end
          end

          # polite delay
          sleep 1
        rescue => e
          puts "   ❌ ページ#{p} 取得失敗: #{e.message}"
        end
      end
    end

    puts "🔖 取得した ID 数: #{game_ids.size}"

    CSV.open(output_file, 'w') do |csv|
      csv << %w[bgg_id]
      game_ids.each { |id| csv << [id] }
    end

    puts "✅ CSV 出力: #{output_file}"
  end
end 