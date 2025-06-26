#!/usr/bin/env ruby

require_relative 'config/environment'
require 'nokogiri'
require 'httparty'

# Tokaidoの投票詳細分析
def analyze_tokaido_votes
  bgg_id = '123540'
  
  puts "🔍 Tokaido (BGG ID: #{bgg_id}) プレイ人数投票詳細分析"
  puts "=" * 60
  
  url = "#{BggService::BASE_URL}/thing?id=#{bgg_id}&stats=1"
  response = HTTParty.get(url, {
    headers: {
      'Accept' => 'application/xml',
      'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 30
  })
  
  if response.code == 200
    doc = Nokogiri::XML(response.body)
    
    poll_results = doc.xpath('//poll[@name="suggested_numplayers"]/results')
    
    poll_results.each do |result|
      num_players = result['numplayers']
      next if num_players.include?('+') # "4+"のような場合はスキップ
      
      best_votes = 0
      recommended_votes = 0
      not_recommended_votes = 0
      
      result.xpath('.//result').each do |vote|
        vote_value = vote['value']
        vote_count = vote['numvotes'].to_i
        
        case vote_value
        when 'Best'
          best_votes = vote_count
        when 'Recommended'
          recommended_votes = vote_count
        when 'Not Recommended'
          not_recommended_votes = vote_count
        end
      end
      
      total_votes = best_votes + recommended_votes + not_recommended_votes
      
      if total_votes > 0
        best_percentage = (best_votes.to_f / total_votes * 100)
        recommended_percentage = (recommended_votes.to_f / total_votes * 100)
        not_recommended_percentage = (not_recommended_votes.to_f / total_votes * 100)
        
        positive_votes = best_votes + recommended_votes
        
        puts "\n#{num_players}人プレイ:"
        puts "  Best: #{best_votes}票 (#{best_percentage.round(1)}%)"
        puts "  Recommended: #{recommended_votes}票 (#{recommended_percentage.round(1)}%)"
        puts "  Not Recommended: #{not_recommended_votes}票 (#{not_recommended_percentage.round(1)}%)"
        puts "  合計: #{total_votes}票"
        puts "  ---------"
        puts "  Positive合計: #{positive_votes}票 (#{((positive_votes.to_f / total_votes) * 100).round(1)}%)"
        puts "  判定: #{positive_votes} > #{not_recommended_votes} ? #{positive_votes > not_recommended_votes ? 'RECOMMENDED' : 'NOT RECOMMENDED'}"
        
        # Best判定
        if best_percentage >= 30.0
          puts "  🏆 Best判定: YES (#{best_percentage.round(1)}% >= 30%)"
        else
          puts "  🏆 Best判定: NO (#{best_percentage.round(1)}% < 30%)"
        end
      end
    end
    
  else
    puts "❌ BGG API エラー: #{response.code}"
  end
end

analyze_tokaido_votes 