#!/usr/bin/env python3
"""
BGR4 SQL インポートスクリプト
エクスポートされたJSONデータからSQL INSERT文を生成
"""

import json
import sys
from datetime import datetime
import re

def escape_sql_string(value):
    """SQL文字列をエスケープ"""
    if value is None:
        return 'NULL'
    
    # 文字列の場合はシングルクォートをエスケープ
    if isinstance(value, str):
        # シングルクォートを2個に変換
        escaped = value.replace("'", "''")
        # 改行文字をエスケープ
        escaped = escaped.replace('\n', '\\n').replace('\r', '\\r')
        return f"'{escaped}'"
    
    # 数値の場合はそのまま
    if isinstance(value, (int, float)):
        return str(value)
    
    # ブール値
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    
    # リストや辞書の場合はJSONとして保存
    if isinstance(value, (list, dict)):
        json_str = json.dumps(value, ensure_ascii=False)
        escaped = json_str.replace("'", "''")
        return f"'{escaped}'"
    
    return 'NULL'

def generate_system_user_sql():
    """システムユーザー作成SQL"""
    return """
-- システムユーザー作成
INSERT INTO users (
    email, name, confirmed_at, created_at, updated_at, is_admin
) VALUES (
    'system@boardgamereviews.com',
    'BoardGameGeek',
    NOW(),
    NOW(),
    NOW(),
    FALSE
) ON CONFLICT (email) DO NOTHING;
"""

def generate_games_sql(games_data):
    """ゲームデータのSQL INSERT文を生成"""
    sql_parts = []
    
    sql_parts.append("-- ゲームデータインポート")
    sql_parts.append("INSERT INTO games (")
    sql_parts.append("    bgg_id, title, japanese_name, description, japanese_description,")
    sql_parts.append("    year_published, min_players, max_players, min_playtime, max_playtime,")
    sql_parts.append("    min_age, complexity, bgg_score, bgg_rank, bgg_num_votes,")
    sql_parts.append("    image_url, japanese_image_url, categories, mechanics,")
    sql_parts.append("    popular_categories, popular_mechanics, publishers, designers,")
    sql_parts.append("    japanese_publisher, release_date, weight, registered_on_site,")
    sql_parts.append("    created_at, updated_at")
    sql_parts.append(") VALUES")
    
    values_parts = []
    
    for i, game in enumerate(games_data):
        # 各フィールドの値を準備
        values = []
        
        # bgg_id (必須)
        values.append(str(game.get('bgg_id')))
        
        # title (name フィールドをtitleに変換)
        values.append(escape_sql_string(game.get('name', game.get('title'))))
        
        # japanese_name
        values.append(escape_sql_string(game.get('japanese_name')))
        
        # description
        values.append(escape_sql_string(game.get('description')))
        
        # japanese_description
        values.append(escape_sql_string(game.get('japanese_description')))
        
        # year_published
        year = game.get('year_published')
        values.append(str(year) if year else 'NULL')
        
        # min_players, max_players
        values.append(str(game.get('min_players', 'NULL')))
        values.append(str(game.get('max_players', 'NULL')))
        
        # min_playtime, max_playtime
        values.append(str(game.get('min_play_time', game.get('min_playtime', 'NULL'))))
        values.append(str(game.get('max_play_time', game.get('max_playtime', 'NULL'))))
        
        # min_age
        values.append(str(game.get('min_age', 'NULL')))
        
        # complexity
        complexity = game.get('complexity')
        if complexity:
            values.append(str(complexity))
        else:
            weight = game.get('weight')
            if weight:
                try:
                    values.append(str(float(weight)))
                except (ValueError, TypeError):
                    values.append('NULL')
            else:
                values.append('NULL')
        
        # bgg_score
        bgg_score = game.get('bgg_score')
        if bgg_score:
            try:
                values.append(str(float(bgg_score)))
            except (ValueError, TypeError):
                values.append('NULL')
        else:
            values.append('NULL')
        
        # bgg_rank
        values.append(str(game.get('bgg_rank', 'NULL')))
        
        # bgg_num_votes
        values.append(str(game.get('bgg_num_votes', 'NULL')))
        
        # image_url, japanese_image_url
        values.append(escape_sql_string(game.get('image_url')))
        values.append(escape_sql_string(game.get('japanese_image_url')))
        
        # categories, mechanics (JSON配列として保存)
        values.append(escape_sql_string(game.get('categories', [])))
        values.append(escape_sql_string(game.get('mechanics', [])))
        
        # popular_categories, popular_mechanics (JSON配列として保存)
        values.append(escape_sql_string(game.get('popular_categories', [])))
        values.append(escape_sql_string(game.get('popular_mechanics', [])))
        
        # publishers, designers (JSON配列として保存)
        publishers = game.get('publishers', [])
        if isinstance(publishers, str):
            publishers = [publishers] if publishers else []
        values.append(escape_sql_string(publishers))
        
        designers = game.get('designers', [])
        if isinstance(designers, str):
            designers = [designers] if designers else []
        values.append(escape_sql_string(designers))
        
        # japanese_publisher
        values.append(escape_sql_string(game.get('japanese_publisher')))
        
        # release_date
        release_date = game.get('release_date')
        if release_date:
            values.append(escape_sql_string(release_date))
        else:
            values.append('NULL')
        
        # weight
        weight = game.get('weight')
        if weight:
            try:
                values.append(str(float(weight)))
            except (ValueError, TypeError):
                values.append('NULL')
        else:
            values.append('NULL')
        
        # registered_on_site
        registered = game.get('registered_on_site', True)
        values.append('TRUE' if registered else 'FALSE')
        
        # created_at, updated_at
        created_at = game.get('created_at')
        updated_at = game.get('updated_at')
        
        if created_at:
            values.append(escape_sql_string(created_at))
        else:
            values.append('NOW()')
        
        if updated_at:
            values.append(escape_sql_string(updated_at))
        else:
            values.append('NOW()')
        
        # VALUES行を作成
        values_line = f"    ({', '.join(values)})"
        values_parts.append(values_line)
        
        # 100件ずつでSQLを分割
        if (i + 1) % 100 == 0 or i == len(games_data) - 1:
            sql_parts.extend(values_parts)
            sql_parts.append("ON CONFLICT (bgg_id) DO UPDATE SET")
            sql_parts.append("    title = EXCLUDED.title,")
            sql_parts.append("    japanese_name = EXCLUDED.japanese_name,")
            sql_parts.append("    description = EXCLUDED.description,")
            sql_parts.append("    japanese_description = EXCLUDED.japanese_description,")
            sql_parts.append("    year_published = EXCLUDED.year_published,")
            sql_parts.append("    min_players = EXCLUDED.min_players,")
            sql_parts.append("    max_players = EXCLUDED.max_players,")
            sql_parts.append("    min_playtime = EXCLUDED.min_playtime,")
            sql_parts.append("    max_playtime = EXCLUDED.max_playtime,")
            sql_parts.append("    min_age = EXCLUDED.min_age,")
            sql_parts.append("    complexity = EXCLUDED.complexity,")
            sql_parts.append("    bgg_score = EXCLUDED.bgg_score,")
            sql_parts.append("    bgg_rank = EXCLUDED.bgg_rank,")
            sql_parts.append("    bgg_num_votes = EXCLUDED.bgg_num_votes,")
            sql_parts.append("    image_url = EXCLUDED.image_url,")
            sql_parts.append("    japanese_image_url = EXCLUDED.japanese_image_url,")
            sql_parts.append("    categories = EXCLUDED.categories,")
            sql_parts.append("    mechanics = EXCLUDED.mechanics,")
            sql_parts.append("    popular_categories = EXCLUDED.popular_categories,")
            sql_parts.append("    popular_mechanics = EXCLUDED.popular_mechanics,")
            sql_parts.append("    publishers = EXCLUDED.publishers,")
            sql_parts.append("    designers = EXCLUDED.designers,")
            sql_parts.append("    japanese_publisher = EXCLUDED.japanese_publisher,")
            sql_parts.append("    release_date = EXCLUDED.release_date,")
            sql_parts.append("    weight = EXCLUDED.weight,")
            sql_parts.append("    registered_on_site = EXCLUDED.registered_on_site,")
            sql_parts.append("    updated_at = EXCLUDED.updated_at;")
            sql_parts.append("")
            
            # 次のバッチの準備
            if i < len(games_data) - 1:
                sql_parts.append("INSERT INTO games (")
                sql_parts.append("    bgg_id, title, japanese_name, description, japanese_description,")
                sql_parts.append("    year_published, min_players, max_players, min_playtime, max_playtime,")
                sql_parts.append("    min_age, complexity, bgg_score, bgg_rank, bgg_num_votes,")
                sql_parts.append("    image_url, japanese_image_url, categories, mechanics,")
                sql_parts.append("    popular_categories, popular_mechanics, publishers, designers,")
                sql_parts.append("    japanese_publisher, release_date, weight, registered_on_site,")
                sql_parts.append("    created_at, updated_at")
                sql_parts.append(") VALUES")
                values_parts = []
    
    return '\n'.join(sql_parts)

def main():
    if len(sys.argv) != 2:
        print("使用方法: python generate_sql_import.py <JSONファイルパス>")
        print("例: python generate_sql_import.py tmp/games_export_20250703_195219.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    print(f"📂 JSONファイルを読み込み中: {json_file}")
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # JSONファイルの構造を確認
        if isinstance(data, dict) and 'games' in data:
            games_data = data['games']
            export_info = data.get('export_info', {})
            print(f"✅ データ読み込み完了: {len(games_data)}件のゲーム")
            if export_info:
                print(f"📊 エクスポート情報: {export_info.get('source_database', 'unknown')} → {export_info.get('target_database', 'unknown')}")
        elif isinstance(data, list):
            games_data = data
            print(f"✅ データ読み込み完了: {len(games_data)}件のゲーム")
        else:
            print("❌ エラー: 予期しないJSONファイル構造")
            sys.exit(1)
    except FileNotFoundError:
        print(f"❌ エラー: ファイルが見つかりません: {json_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ JSON解析エラー: {e}")
        sys.exit(1)
    
    # SQLファイル名を生成
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sql_file = f"bgr4_import_{timestamp}.sql"
    
    print(f"📝 SQLファイルを生成中: {sql_file}")
    
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write("-- BGR4 データインポート用SQL\n")
        f.write(f"-- 生成日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"-- ソースファイル: {json_file}\n")
        f.write(f"-- ゲーム数: {len(games_data)}\n\n")
        
        # システムユーザー作成
        f.write(generate_system_user_sql())
        f.write("\n\n")
        
        # ゲームデータ
        f.write(generate_games_sql(games_data))
    
    print(f"✅ SQLファイル生成完了: {sql_file}")
    print(f"📊 {len(games_data)}件のゲームデータを含むSQL文を生成しました")
    print("\n🚀 次のステップ:")
    print("1. Supabaseのダッシュボードにアクセス")
    print("2. SQL Editor を開く")
    print("3. 生成されたSQLファイルの内容をコピー&ペースト")
    print("4. 実行してデータをインポート")

if __name__ == "__main__":
    main() 