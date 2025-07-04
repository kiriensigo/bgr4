import csv
import json

def check_all_columns_for_json():
    input_file = "games_supabase_final.csv"
    
    with open(input_file, newline='', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        headers = next(reader)
        
        print("=== 全カラムの詳細分析 ===")
        
        # 各カラムのサンプル値を収集
        column_samples = {header: set() for header in headers}
        
        for i, row in enumerate(reader):
            if i >= 10:  # 最初の10行だけ分析
                break
                
            for header, value in zip(headers, row):
                if value and value.strip():
                    column_samples[header].add(value.strip())
        
        # 各カラムの分析結果を表示
        for header in headers:
            samples = list(column_samples[header])[:5]  # 最大5個のサンプル
            print(f"\n--- {header} ---")
            print(f"サンプル値: {samples}")
            
            # JSON配列の可能性をチェック
            json_like = False
            for sample in samples:
                if (sample.startswith('{') and sample.endswith('}')) or \
                   (sample.startswith('[') and sample.endswith(']')) or \
                   sample in ['{}', '[]', '"{}"', '"[]"']:
                    json_like = True
                    break
            
            if json_like:
                print("⚠️  JSON配列形式の可能性があります")
            else:
                print("✅ 通常のテキスト/数値カラム")

if __name__ == "__main__":
    check_all_columns_for_json() 