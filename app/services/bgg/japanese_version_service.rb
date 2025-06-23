# frozen_string_literal: true

module Bgg
  class JapaneseVersionService < BaseService
    def self.get_japanese_version_info(bgg_id)
      handle_http_errors do
        url = "#{XML_API_URL}/thing?id=#{bgg_id}&versions=1"
        response = get(url)
        
        return nil unless response.success?
        
        doc = parse_xml_response(response)
        return nil unless doc
        
        # 日本語版を探す
        japanese_versions = doc.xpath('//version').select do |version|
          language_links = version.xpath('.//link[@type="language"]')
          language_links.any? { |link| link['value'].downcase.include?('japanese') }
        end
        
        return nil if japanese_versions.empty?
        
        # 最初の日本語版の情報を返す
        version = japanese_versions.first
        extract_version_info(version)
      end
    end
    
    def self.search_japanese_version_image(bgg_id, japanese_name)
      # BGGの画像検索APIは限定的なので、バージョン情報から取得
      version_info = get_japanese_version_info(bgg_id)
      return nil unless version_info
      
      version_info[:image_url] || version_info[:thumbnail_url]
    end
    
    def self.get_version_details(version_id)
      handle_http_errors do
        # バージョン詳細はversionのIDで取得
        url = "#{XML_API_URL}/thing?id=#{version_id}&versions=1"
        response = get(url)
        
        return nil unless response.success?
        
        doc = parse_xml_response(response)
        return nil unless doc
        
        version = doc.at_xpath('//version')
        return nil unless version
        
        extract_version_info(version)
      end
    end
    
    def self.search_version_image_by_id(version_id)
      version_info = get_version_details(version_id)
      return nil unless version_info
      
      version_info[:image_url] || version_info[:thumbnail_url]
    end
    
    def self.extract_japanese_publisher(item)
      # 日本の出版社を抽出
      publisher_links = item.xpath('.//link[@type="boardgamepublisher"]')
      
      japanese_publishers = []
      publisher_links.each do |link|
        publisher_name = link['value']
        # 日本の出版社の判定（拡張可能）
        if japanese_publisher?(publisher_name)
          japanese_publishers << publisher_name
        end
      end
      
      japanese_publishers.first
    end
    
    private
    
    def self.extract_version_info(version)
      {
        version_id: version['id'],
        name: version.at_xpath('.//name')&.attr('value'),
        image_url: version.at_xpath('.//image')&.content&.strip,
        thumbnail_url: version.at_xpath('.//thumbnail')&.content&.strip,
        year_published: version.at_xpath('.//yearpublished')&.attr('value')&.to_i,
        publisher: version.at_xpath('.//link[@type="boardgamepublisher"]')&.attr('value'),
        language: version.xpath('.//link[@type="language"]').map { |l| l['value'] }.join(', ')
      }
    end
    
    def self.japanese_publisher?(publisher_name)
      # 日本の出版社パターン（カスタマイズ可能）
      japanese_patterns = [
        /アークライト/i,
        /ホビージャパン/i,
        /グループSNE/i,
        /カナイ製作所/i,
        /テンデイズゲームズ/i,
        /翻訳チーム/i
      ]
      
      japanese_patterns.any? { |pattern| publisher_name.match?(pattern) }
    end
  end
end 