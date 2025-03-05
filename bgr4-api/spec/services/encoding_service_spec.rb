# encoding: utf-8
require 'rails_helper'

RSpec.describe EncodingService do
  describe '.ensure_utf8' do
    it 'nilの場合はnilを返す' do
      expect(EncodingService.ensure_utf8(nil)).to be_nil
    end

    it '既にUTF-8エンコーディングの文字列はそのまま返す' do
      text = 'こんにちは'.encode('UTF-8')
      expect(EncodingService.ensure_utf8(text)).to eq(text)
      expect(EncodingService.ensure_utf8(text).encoding).to eq(Encoding::UTF_8)
    end

    it '異なるエンコーディングの文字列をUTF-8に変換する' do
      # Shift_JISエンコーディングの文字列を作成
      text = 'こんにちは'.encode('Shift_JIS')
      result = EncodingService.ensure_utf8(text)
      
      expect(result.encoding).to eq(Encoding::UTF_8)
      expect(result).to eq('こんにちは')
    end
  end

  describe '.ensure_utf8_array' do
    it 'nilの場合は空配列を返す' do
      expect(EncodingService.ensure_utf8_array(nil)).to eq([])
    end

    it '空配列の場合は空配列を返す' do
      expect(EncodingService.ensure_utf8_array([])).to eq([])
    end

    it '配列内の各文字列をUTF-8エンコーディングに変換する' do
      array = ['こんにちは'.encode('Shift_JIS'), 'さようなら'.encode('Shift_JIS')]
      result = EncodingService.ensure_utf8_array(array)
      
      expect(result.size).to eq(2)
      expect(result[0].encoding).to eq(Encoding::UTF_8)
      expect(result[1].encoding).to eq(Encoding::UTF_8)
      expect(result[0]).to eq('こんにちは')
      expect(result[1]).to eq('さようなら')
    end
  end

  describe '.ensure_utf8_hash_values' do
    it 'nilの場合は空ハッシュを返す' do
      expect(EncodingService.ensure_utf8_hash_values(nil)).to eq({})
    end

    it '空ハッシュの場合は空ハッシュを返す' do
      expect(EncodingService.ensure_utf8_hash_values({})).to eq({})
    end

    it 'ハッシュの文字列値をUTF-8エンコーディングに変換する' do
      hash = {
        name: 'こんにちは'.encode('Shift_JIS'),
        greeting: 'さようなら'.encode('Shift_JIS')
      }
      result = EncodingService.ensure_utf8_hash_values(hash)
      
      expect(result[:name].encoding).to eq(Encoding::UTF_8)
      expect(result[:greeting].encoding).to eq(Encoding::UTF_8)
      expect(result[:name]).to eq('こんにちは')
      expect(result[:greeting]).to eq('さようなら')
    end

    it 'ネストされた配列内の文字列をUTF-8エンコーディングに変換する' do
      hash = {
        greetings: ['こんにちは'.encode('Shift_JIS'), 'さようなら'.encode('Shift_JIS')]
      }
      result = EncodingService.ensure_utf8_hash_values(hash)
      
      expect(result[:greetings][0].encoding).to eq(Encoding::UTF_8)
      expect(result[:greetings][1].encoding).to eq(Encoding::UTF_8)
      expect(result[:greetings][0]).to eq('こんにちは')
      expect(result[:greetings][1]).to eq('さようなら')
    end

    it 'ネストされたハッシュ内の文字列をUTF-8エンコーディングに変換する' do
      hash = {
        user: {
          name: 'こんにちは'.encode('Shift_JIS'),
          greeting: 'さようなら'.encode('Shift_JIS')
        }
      }
      result = EncodingService.ensure_utf8_hash_values(hash)
      
      expect(result[:user][:name].encoding).to eq(Encoding::UTF_8)
      expect(result[:user][:greeting].encoding).to eq(Encoding::UTF_8)
      expect(result[:user][:name]).to eq('こんにちは')
      expect(result[:user][:greeting]).to eq('さようなら')
    end

    it '非文字列値はそのまま保持する' do
      hash = {
        name: 'こんにちは'.encode('Shift_JIS'),
        count: 42,
        active: true,
        data: nil
      }
      result = EncodingService.ensure_utf8_hash_values(hash)
      
      expect(result[:name].encoding).to eq(Encoding::UTF_8)
      expect(result[:count]).to eq(42)
      expect(result[:active]).to eq(true)
      expect(result[:data]).to be_nil
    end
  end
end 