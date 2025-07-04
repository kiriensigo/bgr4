import csv
import json

def check_csv_headers_and_json_columns():
    input_file = "games_supabase_fixed.csv"
    
    # ヘッダー行を読み込み
    with open(input_file, newline='', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        headers = next(reader)
        
        print("=== CSVヘッダー（カラム名）===")
        for i, header in enumerate(headers):
            print(f"{i+1:2d}. {header}")
        
        print(f"\n=== 合計 {len(headers)} カラム ===")
        
        # JSON配列カラムの候補を特定
        json_array_candidates = []
        for header in headers:
            if any(keyword in header.lower() for keyword in ['categories', 'mechanics', 'tags', 'features', 'genres']):
                json_array_candidates.append(header)
        
        print(f"\n=== JSON配列カラム候補 ===")
        for candidate in json_array_candidates:
            print(f"- {candidate}")
        
        # 最初の数行のデータを確認
        print(f"\n=== 最初の3行のデータサンプル ===")
        for i, row in enumerate(reader):
            if i >= 3:
                break
            print(f"\n--- 行 {i+1} ---")
            for j, (header, value) in enumerate(zip(headers, row)):
                if header in json_array_candidates:
                    print(f"  {header}: {value}")

if __name__ == "__main__":
    check_csv_headers_and_json_columns() 