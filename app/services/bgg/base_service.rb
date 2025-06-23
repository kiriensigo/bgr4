# frozen_string_literal: true

module Bgg
  class BaseService
    include HTTParty
    
    BASE_URL = 'https://www.boardgamegeek.com'
    XML_API_URL = 'https://www.boardgamegeek.com/xmlapi2'
    
    # HTTPartyの設定
    base_uri BASE_URL
    headers 'User-Agent' => 'BoardGameBudget/1.0'
    timeout 30
    
    private
    
    def self.handle_http_errors
      yield
    rescue Net::TimeoutError => e
      Rails.logger.error "BGG API Timeout: #{e.message}"
      raise StandardError, "BGG APIがタイムアウトしました"
    rescue StandardError => e
      Rails.logger.error "BGG API Error: #{e.message}"
      raise
    end
    
    def self.parse_xml_response(response)
      return nil unless response&.success?
      
      begin
        Nokogiri::XML(response.body)
      rescue Nokogiri::XML::SyntaxError => e
        Rails.logger.error "XML Parse Error: #{e.message}"
        nil
      end
    end
    
    def self.wait_for_api_limit
      sleep(1.2) # BGG API制限対応
    end
  end
end 