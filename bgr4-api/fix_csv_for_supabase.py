#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSVファイルのJSONカラムを修正するスクリプト
SupabaseのCSVインポート用にJSONカラムを正しい形式に変換
"""

import csv
import sys

def fix_csv_for_supabase(input_file, output_file):
    """CSVファイルのJSONカラムを修正"""
    
    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        rows = list(reader)
    
    if not rows:
        print("CSVファイルが空です")
        return
    
    # ヘッダー行を取得
    headers = rows[0]
    
    # JSONカラムのインデックスを特定
    json_columns = []
    for i, header in enumerate(headers):
        if header in ['metadata', 'categories', 'mechanics']:
            json_columns.append(i)
    
    print(f"修正対象のJSONカラム: {[headers[i] for i in json_columns]}")
    
    # データ行を修正
    fixed_rows = [headers]  # ヘッダー行はそのまま
    
    for row in rows[1:]:  # データ行を処理
        fixed_row = row.copy()
        
        for col_idx in json_columns:
            if col_idx < len(fixed_row):
                value = fixed_row[col_idx]
                
                # 空文字、NULL、{}、[]を正しいJSON文字列に変換
                if not value or value.strip() == '' or value.strip() == '{}' or value.strip() == '[]':
                    fixed_row[col_idx] = '"{}"'
                elif not value.startswith('"'):
                    # ダブルクォートで囲まれていない場合は追加
                    fixed_row[col_idx] = f'"{value}"'
        
        fixed_rows.append(fixed_row)
    
    # 修正したCSVを保存
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.writer(outfile)
        writer.writerows(fixed_rows)
    
    print(f"修正完了: {output_file}")
    print(f"処理件数: {len(fixed_rows) - 1}件")

if __name__ == "__main__":
    input_file = "games.csv"
    output_file = "games_supabase_fixed.csv"
    
    try:
        fix_csv_for_supabase(input_file, output_file)
        print("✅ 修正が完了しました！")
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        sys.exit(1) 