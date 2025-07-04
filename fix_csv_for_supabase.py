#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSVファイルのJSONカラムを修正するスクリプト
SupabaseのCSVインポート用にJSONカラムを正しい形式に変換
"""

import csv
import sys
import json

def fix_csv_for_supabase(input_file, output_file):
    """CSVファイルのJSONカラムを修正"""
    
    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        rows = [row for row in reader if any(cell.strip() for cell in row)]  # 完全な空行は除外
    
    if not rows:
        print("CSVファイルが空です")
        return
    
    # ヘッダー行を取得
    headers = rows[0]
    
    # JSONオブジェクトカラム
    json_object_columns = ['metadata']
    # JSON配列カラム
    json_array_columns = [
        'categories', 'mechanics', 'popular_categories', 'popular_mechanics',
        'best_num_players', 'recommended_num_players', 'site_recommended_players',
        'designers', 'artists', 'publishers'
    ]
    
    # カラム名→インデックス辞書
    col_idx = {h: i for i, h in enumerate(headers)}
    
    print("修正対象のJSONオブジェクトカラム:", json_object_columns)
    print("修正対象のJSON配列カラム:", json_array_columns)
    
    fixed_rows = [headers]
    for row in rows[1:]:
        fixed_row = row.copy()
        # オブジェクト型カラム
        for col in json_object_columns:
            idx = col_idx.get(col)
            if idx is not None and idx < len(fixed_row):
                value = fixed_row[idx]
                if not value or value.strip() == '' or value.strip() == '{}':
                    fixed_row[idx] = '{}'
                elif not value.strip().startswith('{'):
                    fixed_row[idx] = '{}'
        # 配列型カラム
        for col in json_array_columns:
            idx = col_idx.get(col)
            if idx is not None and idx < len(fixed_row):
                value = fixed_row[idx]
                # 空欄や{}や[]やnullは[]に
                if not value or value.strip() in ['', '{}', '[]', 'null', 'NULL']:
                    fixed_row[idx] = '[]'
                # {a,b,c}や{1,2,3}などを["a","b","c"]に変換
                elif value.strip().startswith('{') and value.strip().endswith('}'): 
                    items = [v.strip() for v in value.strip('{}').split(',') if v.strip()]
                    fixed_row[idx] = json.dumps(items, ensure_ascii=False)
                # すでに[で始まる場合はそのまま（ただしJSONとしてパースできなければ[]に）
                elif value.strip().startswith('['):
                    try:
                        json.loads(value)
                    except Exception:
                        fixed_row[idx] = '[]'
                # カンマ区切りの文字列を配列に
                elif ',' in value:
                    items = [v.strip() for v in value.split(',') if v.strip()]
                    fixed_row[idx] = json.dumps(items, ensure_ascii=False)
                # それ以外は1要素配列
                else:
                    fixed_row[idx] = json.dumps([value.strip()], ensure_ascii=False)
        fixed_rows.append(fixed_row)
    
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.writer(outfile)
        writer.writerows(fixed_rows)
    print(f"修正完了: {output_file}")
    print(f"処理件数: {len(fixed_rows) - 1}件")

if __name__ == "__main__":
    input_file = "games_supabase_fixed.csv"
    output_file = "games_supabase_final.csv"
    try:
        fix_csv_for_supabase(input_file, output_file)
        print("✅ 修正が完了しました！")
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        sys.exit(1) 