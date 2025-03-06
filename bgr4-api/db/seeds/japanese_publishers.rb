# 日本語出版社の初期データ
# 形式: [BGG ID, 出版社名]
japanese_publishers_data = [
  [314343, '株式会社ケンビル'], # Cascadia
  [342942, '株式会社ケンビル'], # Ark Nova
  [291457, '株式会社ホビージャパン'], # Gloomhaven
  [174430, 'アークライト'], # Gloomhaven
  [233078, 'アークライト'], # Wingspan
  [266192, 'アークライト'], # Wingspan: European Expansion
  [300905, 'アークライト'], # Wingspan: Oceania Expansion
  [360431, 'アークライト'], # Wingspan: Asia Expansion
  [167791, 'アークライト'], # Terraforming Mars
  [328479, 'アークライト'], # Terraforming Mars: Ares Expedition
  [224517, 'アークライト'], # Brass: Birmingham
  [220308, 'アークライト'], # Gaia Project
  [169786, 'アークライト'], # Scythe
  [256916, 'アークライト'], # Azul
  [230802, 'アークライト'], # Azul: Summer Pavilion
  [284083, 'アークライト'], # Azul: Stained Glass of Sintra
  [192291, 'アークライト'], # Too Many Bones
  [173346, 'アークライト'], # 7 Wonders Duel
  [68448, 'アークライト'], # 7 Wonders
  [148228, 'アークライト'], # Splendor
  [182028, 'アークライト'], # Viticulture Essential Edition
  [164928, 'アークライト'], # Orleans
  [205637, 'アークライト'], # Everdell
  [266810, 'アークライト'], # Wingspan
  [266192, 'アークライト'], # Wingspan: European Expansion
  [300905, 'アークライト'], # Wingspan: Oceania Expansion
  [360431, 'アークライト'], # Wingspan: Asia Expansion
  [167791, 'アークライト'], # Terraforming Mars
  [328479, 'アークライト'], # Terraforming Mars: Ares Expedition
  [224517, 'アークライト'], # Brass: Birmingham
  [220308, 'アークライト'], # Gaia Project
  [169786, 'アークライト'], # Scythe
  [256916, 'アークライト'], # Azul
  [230802, 'アークライト'], # Azul: Summer Pavilion
  [284083, 'アークライト'], # Azul: Stained Glass of Sintra
  [192291, 'アークライト'], # Too Many Bones
  [173346, 'アークライト'], # 7 Wonders Duel
  [68448, 'アークライト'], # 7 Wonders
  [148228, 'アークライト'], # Splendor
  [182028, 'アークライト'], # Viticulture Essential Edition
  [164928, 'アークライト'], # Orleans
  [205637, 'アークライト'], # Everdell
]

# データベースに登録
japanese_publishers_data.each do |bgg_id, publisher_name|
  # 既存のレコードがあれば更新、なければ作成
  jp = JapanesePublisher.find_or_initialize_by(bgg_id: bgg_id)
  jp.publisher_name = publisher_name
  jp.save!
  puts "Added/Updated Japanese publisher for BGG ID #{bgg_id}: #{publisher_name}"
end 