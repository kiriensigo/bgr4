#!/usr/bin/env python3
"""
BGR4 データ移行スクリプト
ローカルのエクスポートJSONファイルをRender APIに送信してデータを移行
"""

import json
import requests
import time
import sys
from pathlib import Path

# 設定
RENDER_API_BASE = "https://bgr4-api.onrender.com"
BATCH_SIZE = 50  # 一度に送信するゲーム数
DELAY_BETWEEN_BATCHES = 2  # バッチ間の待機時間（秒）

def load_export_data(filepath):
    """エクスポートファイルを読み込み"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ データ読み込み完了: {len(data)}件のゲーム")
        return data
    except FileNotFoundError:
        print(f"❌ エラー: ファイルが見つかりません: {filepath}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ JSON解析エラー: {e}")
        return None

def create_system_user():
    """システムユーザーを作成"""
    url = f"{RENDER_API_BASE}/auth"
    
    # システムユーザーのデータ
    user_data = {
        "email": "system@boardgamereviews.com",
        "name": "BoardGameGeek",
        "password": "SystemUser2025!@#",
        "password_confirmation": "SystemUser2025!@#"
    }
    
    try:
        response = requests.post(url, json=user_data, timeout=30)
        print(f"システムユーザー作成レスポンス: {response.status_code}")
        print(f"レスポンス内容: {response.text[:200]}")
        
        if response.status_code in [200, 201]:
            print("✅ システムユーザー作成完了")
            return True
        else:
            print(f"⚠️ システムユーザー作成: ステータス {response.status_code}")
            return False
            
    except requests.RequestException as e:
        print(f"❌ システムユーザー作成エラー: {e}")
        return False

def create_single_game(game_data):
    """単一のゲームを作成"""
    url = f"{RENDER_API_BASE}/api/v1/games"
    
    # 必要なフィールドのみを抽出
    game_payload = {
        "title": game_data.get("title"),
        "japanese_name": game_data.get("japanese_name"),
        "bgg_id": game_data.get("bgg_id"),
        "description": game_data.get("description"),
        "japanese_description": game_data.get("japanese_description"),
        "year_published": game_data.get("year_published"),
        "min_players": game_data.get("min_players"),
        "max_players": game_data.get("max_players"),
        "min_playtime": game_data.get("min_playtime"),
        "max_playtime": game_data.get("max_playtime"),
        "min_age": game_data.get("min_age"),
        "complexity": game_data.get("complexity"),
        "bgg_score": game_data.get("bgg_score"),
        "bgg_rank": game_data.get("bgg_rank"),
        "bgg_num_votes": game_data.get("bgg_num_votes"),
        "image_url": game_data.get("image_url"),
        "japanese_image_url": game_data.get("japanese_image_url"),
        "categories": game_data.get("categories", []),
        "mechanics": game_data.get("mechanics", []),
        "popular_categories": game_data.get("popular_categories", []),
        "popular_mechanics": game_data.get("popular_mechanics", []),
        "publishers": game_data.get("publishers", []),
        "designers": game_data.get("designers", []),
        "japanese_publisher": game_data.get("japanese_publisher"),
        "release_date": game_data.get("release_date"),
        "weight": game_data.get("weight"),
        "registered_on_site": game_data.get("registered_on_site", False)
    }
    
    try:
        response = requests.post(url, json=game_payload, timeout=30)
        return response.status_code in [200, 201]
    except requests.RequestException:
        return False

def migrate_games_in_batches(games_data):
    """ゲームデータをバッチで移行"""
    total_games = len(games_data)
    success_count = 0
    error_count = 0
    
    print(f"🚀 ゲーム移行開始: {total_games}件")
    
    for i in range(0, total_games, BATCH_SIZE):
        batch = games_data[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (total_games + BATCH_SIZE - 1) // BATCH_SIZE
        
        print(f"\n📦 バッチ {batch_num}/{total_batches} 処理中... ({len(batch)}件)")
        
        for game in batch:
            if create_single_game(game):
                success_count += 1
                print(f"✅ {game.get('title', 'Unknown')}")
            else:
                error_count += 1
                print(f"❌ {game.get('title', 'Unknown')}")
        
        progress = ((i + len(batch)) / total_games) * 100
        print(f"進捗: {progress:.1f}% (成功: {success_count}, エラー: {error_count})")
        
        # バッチ間の待機
        if i + BATCH_SIZE < total_games:
            print(f"⏱️  {DELAY_BETWEEN_BATCHES}秒待機中...")
            time.sleep(DELAY_BETWEEN_BATCHES)
    
    print(f"\n✅ 移行完了!")
    print(f"📊 結果: 成功 {success_count}件, エラー {error_count}件")
    return success_count, error_count

def main():
    if len(sys.argv) != 2:
        print("使用方法: python migrate_to_render.py <JSONファイルパス>")
        print("例: python migrate_to_render.py tmp/games_export_20250703_195219.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    print("🔄 BGR4 データ移行スクリプト開始")
    print(f"📂 ファイル: {json_file}")
    print(f"🎯 移行先: {RENDER_API_BASE}")
    
    # JSONデータ読み込み
    games_data = load_export_data(json_file)
    if not games_data:
        sys.exit(1)
    
    # システムユーザー作成
    print("\n👤 システムユーザー作成中...")
    create_system_user()
    
    # 移行実行確認
    response = input(f"\n{len(games_data)}件のゲームを移行しますか？ (y/N): ")
    if response.lower() != 'y':
        print("移行をキャンセルしました")
        sys.exit(0)
    
    # ゲーム移行実行
    success, errors = migrate_games_in_batches(games_data)
    
    if errors == 0:
        print("🎉 全ての移行が成功しました！")
    else:
        print(f"⚠️ {errors}件のエラーがありました。ログを確認してください。")

if __name__ == "__main__":
    main() 