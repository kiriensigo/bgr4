# ゲームの平均値カラム追加と更新

このドキュメントでは、ゲームの平均値（総合評価、ルールの複雑さ、インタラクション、ダウンタイム、運要素）をデータベースに保存するための手順を説明します。

## 1. マイグレーションの実行

以下のコマンドを実行して、ゲームテーブルに平均値カラムを追加します：

```bash
rails db:migrate
```

これにより、以下のカラムがゲームテーブルに追加されます：

- `average_complexity`: 平均ルールの複雑さ（旧 `average_weight`）
- `average_interaction`: 平均インタラクション
- `average_downtime`: 平均ダウンタイム
- `average_luck_factor`: 平均運要素

`average_score`カラムは既に存在するため、追加されません。

## 2. 既存のゲームの平均値を更新

以下の Rake タスクを実行して、既存のゲームの平均値を更新します：

```bash
rails games:update_average_values
```

このタスクは、全てのゲームの平均値を計算し、データベースに保存します。

## 3. 動作確認

平均値が正しく更新されたことを確認するには、以下のコマンドを Rails コンソールで実行します：

```bash
rails c
```

```ruby
game = Game.first
puts "平均総合評価: #{game.average_score}"
puts "平均ルールの複雑さ: #{game.average_complexity}"
puts "平均インタラクション: #{game.average_interaction}"
puts "平均ダウンタイム: #{game.average_downtime}"
puts "平均運要素: #{game.average_luck_factor}"
```

## 4. 自動更新の仕組み

レビューが作成・更新・削除されると、自動的にゲームの平均値が更新されます。この処理は非同期ジョブ（`UpdateGameAverageValuesJob`）で実行されます。

## 5. 検索機能の変更点

検索機能は、レビューテーブルではなくゲームテーブルの平均値カラムを使用するように変更されました。これにより、検索処理が高速化され、より正確な結果が得られるようになります。
