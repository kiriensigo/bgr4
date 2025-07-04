import csv
import json
import re

def fix_json_array(value):
    """値を正しいJSON配列形式に変換"""
    if value is None or value.strip() == "":
        return "[]"
    
    value = value.strip()
    
    # 空のオブジェクト {} または "{}"
    if value in ["{}", '"{}"', "[]", '"[]"']:
        return "[]"
    
    # PostgreSQL配列形式 {a,b,c} を ["a","b","c"] に変換
    if value.startswith("{") and value.endswith("}"):
        # 中身を抽出
        content = value[1:-1]
        if not content.strip():
            return "[]"
        
        # カンマで分割して配列に変換
        items = []
        for item in content.split(","):
            item = item.strip().strip('"').strip("'")
            if item:
                items.append(item)
        
        return json.dumps(items, ensure_ascii=False)
    
    # 既にJSON配列形式かチェック
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return json.dumps(parsed, ensure_ascii=False)
    except (json.JSONDecodeError, ValueError):
        pass
    
    # その他の場合は単一要素の配列として扱う
    return json.dumps([value], ensure_ascii=False)

def fix_all_json_arrays():
    input_file = "games_supabase_final.csv"
    output_file = "games_supabase_complete.csv"
    
    # すべてのJSON配列カラムのリスト
    json_array_columns = [
        "popular_categories",
        "popular_mechanics", 
        "categories",
        "mechanics",
        "best_num_players",
        "recommended_num_players",
        "site_recommended_players",
        "designers",
        "artists",
        "publishers"
    ]
    
    print(f"すべてのJSON配列カラムを修正中...")
    print(f"対象カラム: {json_array_columns}")
    
    fixed_count = 0
    total_rows = 0
    
    with open(input_file, newline='', encoding='utf-8') as infile, \
         open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        
        reader = csv.DictReader(infile)
        writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames)
        writer.writeheader()
        
        for row in reader:
            total_rows += 1
            row_fixed = False
            
            for col in json_array_columns:
                if col in row:
                    old_value = row[col]
                    new_value = fix_json_array(old_value)
                    
                    if old_value != new_value:
                        print(f"行 {total_rows}, カラム {col}: '{old_value}' → '{new_value}'")
                        row_fixed = True
                    
                    row[col] = new_value
            
            if row_fixed:
                fixed_count += 1
            
            writer.writerow(row)
    
    print(f"\n=== 修正完了 ===")
    print(f"総行数: {total_rows}")
    print(f"修正された行数: {fixed_count}")
    print(f"出力ファイル: {output_file}")
    
    # 修正後のサンプルを表示
    print(f"\n=== 修正後のサンプル ===")
    with open(output_file, newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        for i, row in enumerate(reader):
            if i >= 3:
                break
            print(f"\n--- 行 {i+1} ---")
            for col in json_array_columns:
                print(f"  {col}: {row[col]}")

if __name__ == "__main__":
    fix_all_json_arrays() 