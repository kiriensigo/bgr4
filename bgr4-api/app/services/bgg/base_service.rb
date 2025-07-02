# frozen_string_literal: true

module Bgg
  class BaseService
    include HTTParty
    base_uri 'https://boardgamegeek.com'

    XML_API_URL = 'https://boardgamegeek.com/xmlapi2'
    BASE_URL = 'https://boardgamegeek.com'

    def self.handle_http_errors
      begin
        yield
      rescue HTTParty::Error => e
        Rails.logger.error "HTTP request failed: #{e.message}"
        nil
      rescue StandardError => e
        Rails.logger.error "Error in BGG service: #{e.message}"
        nil
      end
    end

    def self.parse_xml_response(response)
      Nokogiri::XML(response.body)
    rescue => e
      Rails.logger.error "Failed to parse XML response: #{e.message}"
      nil
    end

    def self.get(url, options = {})
      default_options = {
        headers: {
          'Accept' => 'application/xml',
          'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30
      }

      HTTParty.get(url, default_options.merge(options))
    end

    def self.wait_for_api_limit
      sleep(2) # BGG APIの制限に対応するための待機時間
    end
  end
end 