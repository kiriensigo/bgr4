import { XMLParser } from "fast-xml-parser";
import axios from "axios";

const BGG_API_BASE = "https://boardgamegeek.com/xmlapi2";
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

export interface BGGGameDetails {
  id: string;
  name: string;
  description: string;
  image: string;
  japaneseImage?: string;
  minPlayers: number;
  maxPlayers: number;
  minPlayTime: number;
  maxPlayTime: number;
  yearPublished?: number;
  averageRating?: number;
  mechanics?: string[];
  categories?: string[];
  weight: number;
  bestPlayers: string[];
  recommendedPlayers: string[];
  publisher?: string;
  designer?: string;
  releaseDate?: string;
  japaneseReleaseDate?: string;
  japanesePublisher?: string;
  japaneseName?: string;
  expansions?: Array<{ id: string; name: string }>;
  baseGame?: { id: string; name: string };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      const text = await response.text();

      // BGGが処理中の場合は待機
      if (text.includes("Please try again later")) {
        await sleep(2000);
        continue;
      }
      return text;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(2000);
    }
  }
  throw new Error("BGGへのリクエストが失敗しました");
}

// 日本語版の画像を検索する関数
async function searchJapaneseVersionImage(
  id: string,
  japaneseName: string
): Promise<string | null> {
  try {
    // BGGの画像ギャラリーを検索
    const galleryXml = await fetchWithRetry(
      `${BGG_API_BASE}/images?thing=${id}`
    );
    const galleryResult = parser.parse(galleryXml);

    if (!galleryResult.items?.item) {
      return null;
    }

    const imageItems = Array.isArray(galleryResult.items.item)
      ? galleryResult.items.item
      : [galleryResult.items.item];

    console.log("Found images in gallery:", imageItems.length);

    // 日本語版の画像を探す（キャプションに日本語が含まれているか、「Japanese」「Japan」などのキーワードが含まれている画像）
    for (const image of imageItems) {
      const caption = image.caption || "";

      // 日本語版の画像かどうかを判定
      const isJapaneseImage =
        caption.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/) ||
        caption.toLowerCase().includes("japanese") ||
        caption.toLowerCase().includes("japan") ||
        caption.includes("日本語");

      if (isJapaneseImage) {
        const imageUrl = image.large || image.medium || image.small;
        console.log("Found Japanese version image with caption:", caption);
        return imageUrl;
      }
    }

    return null;
  } catch (error) {
    console.error("Error searching Japanese version image:", error);
    return null;
  }
}

export async function getBGGGameDetails(id: string): Promise<BGGGameDetails> {
  try {
    const xml = await fetchWithRetry(`${BGG_API_BASE}/thing?id=${id}&stats=1`);
    const result = parser.parse(xml);

    if (!result.items?.item) {
      throw new Error("ゲーム情報が見つかりませんでした");
    }

    const item = Array.isArray(result.items.item)
      ? result.items.item[0]
      : result.items.item;

    // プレイ人数の投票データを解析
    const numplayersPoll = item.poll?.find(
      (p: any) => p["@_name"] === "suggested_numplayers"
    );
    const bestPlayers: string[] = [];
    const recommendedPlayers: string[] = [];

    if (numplayersPoll?.results) {
      const results = Array.isArray(numplayersPoll.results)
        ? numplayersPoll.results
        : [numplayersPoll.results];

      results.forEach((result: any) => {
        const numPlayers = result["@_numplayers"];
        const votes = Array.isArray(result.result)
          ? result.result
          : [result.result];

        const bestVotes = parseInt(votes[0]?.["@_numvotes"]) || 0;
        const recommendedVotes = parseInt(votes[1]?.["@_numvotes"]) || 0;
        const notRecommendedVotes = parseInt(votes[2]?.["@_numvotes"]) || 0;
        const totalVotes = bestVotes + recommendedVotes + notRecommendedVotes;

        if (totalVotes > 0) {
          // ベストプレイ人数の判定（最も多い投票を獲得）
          if (bestVotes > recommendedVotes && bestVotes > notRecommendedVotes) {
            bestPlayers.push(numPlayers);
          }
          // 推奨プレイ人数の判定（Best + Recommendedの投票がNotRecommendedより多い）
          if (bestVotes + recommendedVotes > notRecommendedVotes) {
            recommendedPlayers.push(numPlayers);
          }
        }
      });
    }

    // weightの取得を確実に行う
    const weight =
      parseFloat(item.statistics?.ratings?.averageweight?.["@_value"]) || 0;
    console.log("BGG Weight:", weight);
    console.log("Best Players:", bestPlayers);
    console.log("Recommended Players:", recommendedPlayers);

    // 名前を取得（プライマリー名を優先）
    const names = Array.isArray(item.name) ? item.name : [item.name];
    const primaryName =
      names.find((n: any) => n["@_type"] === "primary")?.["@_value"] ||
      names[0]?.["@_value"] ||
      "";

    // 日本語名を探す
    const japaneseName = names.find(
      (n: any) =>
        n["@_type"] === "alternate" &&
        n["@_value"].match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
    )?.["@_value"];

    console.log(
      "All names:",
      names.map((n: any) => ({ type: n["@_type"], value: n["@_value"] }))
    );
    console.log("Japanese name detected from alternate names:", japaneseName);

    // 出版社情報を取得
    const publishers = (item.link || [])
      .filter((link: any) => link["@_type"] === "boardgamepublisher")
      .map((link: any) => link["@_value"]);

    // 日本語版の出版社を探す（日本の出版社名を含むものを探す）
    const japanesePublishers = publishers.filter(
      (publisher) =>
        publisher.includes("Hobby Japan") ||
        publisher.includes("アークライト") ||
        publisher.includes("ホビージャパン") ||
        publisher.includes("アークライト") ||
        publisher.includes("Arclight") ||
        publisher.includes("Japon Brand") ||
        publisher.includes("Grounding") ||
        publisher.includes("グラウンディング") ||
        publisher.includes("Oink Games") ||
        publisher.includes("オインクゲームズ") ||
        publisher.includes("Sugorokuya") ||
        publisher.includes("すごろくや") ||
        publisher.includes("テンデイズゲームズ") ||
        publisher.includes("Ten Days Games") ||
        publisher.includes("COLON ARC") ||
        publisher.includes("コロンアーク") ||
        publisher.includes("Analog Lunchbox") ||
        publisher.includes("アナログランチボックス") ||
        publisher.includes("Domina Games") ||
        publisher.includes("ドミナゲームズ") ||
        publisher.includes("OKAZU Brand") ||
        publisher.includes("おかず") ||
        publisher.includes("Suki Games") ||
        publisher.includes("数寄ゲームズ") ||
        publisher.includes("Yanagisawa") ||
        publisher.includes("柳澤") ||
        publisher.includes("Ayatsurare Ningyoukan") ||
        publisher.includes("あやつられ人形館") ||
        publisher.includes("BakaFire") ||
        publisher.includes("バカファイア") ||
        publisher.includes("Manifest Destiny") ||
        publisher.includes("マニフェストデスティニー") ||
        publisher.includes("Saien") ||
        publisher.includes("彩園") ||
        publisher.includes("Sato Familie") ||
        publisher.includes("佐藤ファミリー") ||
        publisher.includes("Shinojo") ||
        publisher.includes("紫猫") ||
        publisher.includes("Takoashi Games") ||
        publisher.includes("タコアシゲームズ") ||
        publisher.includes("Takuya Ono") ||
        publisher.includes("小野卓也") ||
        publisher.includes("Yocto Games") ||
        publisher.includes("ヨクト") ||
        publisher.includes("Yuhodo") ||
        publisher.includes("遊歩堂") ||
        publisher.includes("Itten") ||
        publisher.includes("いつつ") ||
        publisher.includes("Jelly Jelly Games") ||
        publisher.includes("ジェリージェリーゲームズ") ||
        publisher.includes("Kocchiya") ||
        publisher.includes("こっちや") ||
        publisher.includes("Kuuri") ||
        publisher.includes("くうり") ||
        publisher.includes("New Games Order") ||
        publisher.includes("ニューゲームズオーダー") ||
        publisher.includes("Qvinta") ||
        publisher.includes("クインタ") ||
        publisher.includes("Route11") ||
        publisher.includes("ルート11") ||
        publisher.includes("Suki Games Mk2") ||
        publisher.includes("スキゲームズMk2") ||
        publisher.includes("Taikikennai Games") ||
        publisher.includes("耐気圏内ゲームズ") ||
        publisher.includes("Team Saien") ||
        publisher.includes("チーム彩園") ||
        publisher.includes("Tokyo Game Market") ||
        publisher.includes("東京ゲームマーケット") ||
        publisher.includes("Toshiki Sato") ||
        publisher.includes("佐藤敏樹") ||
        publisher.includes("Yuuai Kikaku") ||
        publisher.includes("遊愛企画") ||
        publisher.includes("Capcom") ||
        publisher.includes("カプコン") ||
        publisher.includes("Bandai") ||
        publisher.includes("バンダイ") ||
        publisher.includes("Konami") ||
        publisher.includes("コナミ") ||
        publisher.includes("Nintendo") ||
        publisher.includes("任天堂") ||
        publisher.includes("Sega") ||
        publisher.includes("セガ") ||
        publisher.includes("Square Enix") ||
        publisher.includes("スクウェア・エニックス") ||
        publisher.includes("Taito") ||
        publisher.includes("タイトー") ||
        publisher.includes("Takara Tomy") ||
        publisher.includes("タカラトミー") ||
        publisher.includes("Kadokawa") ||
        publisher.includes("角川") ||
        publisher.includes("Shogakukan") ||
        publisher.includes("小学館") ||
        publisher.includes("Shueisha") ||
        publisher.includes("集英社") ||
        publisher.includes("Kodansha") ||
        publisher.includes("講談社") ||
        publisher.includes("Gentosha") ||
        publisher.includes("幻冬舎") ||
        publisher.includes("Hayakawa") ||
        publisher.includes("早川") ||
        publisher.includes("Kawada") ||
        publisher.includes("カワダ") ||
        publisher.includes("Ensky") ||
        publisher.includes("エンスカイ") ||
        publisher.includes("Megahouse") ||
        publisher.includes("メガハウス") ||
        publisher.includes("Hanayama") ||
        publisher.includes("ハナヤマ") ||
        publisher.includes("Beverly") ||
        publisher.includes("ビバリー") ||
        publisher.includes("Tenyo") ||
        publisher.includes("テンヨー") ||
        publisher.includes("Epoch") ||
        publisher.includes("エポック") ||
        publisher.includes("Hasbro Japan") ||
        publisher.includes("ハズブロジャパン") ||
        publisher.includes("Asmodee Japan") ||
        publisher.includes("アズモデージャパン") ||
        publisher.includes("Gゲームズ") ||
        publisher.includes("G Games") ||
        publisher.includes("Engames") ||
        publisher.includes("エンゲームズ") ||
        publisher.includes("Mobius Games") ||
        publisher.includes("メビウスゲームズ") ||
        publisher.includes("Moaideas") ||
        publisher.includes("モアイデアズ") ||
        publisher.includes("Analog Game") ||
        publisher.includes("アナログゲーム") ||
        publisher.includes("Japan") ||
        publisher.includes("日本") ||
        publisher.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
    );

    const japanesePublisher =
      japanesePublishers.length > 0 ? japanesePublishers[0] : undefined;
    console.log("Japanese publisher detected:", japanesePublisher);

    // 日本語版の画像を探す
    let japaneseImage: string | undefined;

    // 画像バージョンを取得
    const images = Array.isArray(item.image)
      ? item.image
      : item.image
      ? [item.image]
      : [];
    const thumbnails = Array.isArray(item.thumbnail)
      ? item.thumbnail
      : item.thumbnail
      ? [item.thumbnail]
      : [];

    // 日本語版の情報を取得
    let japaneseVersionInfo: any = null;
    try {
      // 日本語版の情報を取得するために、バージョン情報を取得
      const versionsXml = await fetchWithRetry(
        `${BGG_API_BASE}/thing?id=${id}&versions=1`
      );
      const versionsResult = parser.parse(versionsXml);

      if (versionsResult.items?.item?.versions?.item) {
        const versionItems = Array.isArray(
          versionsResult.items.item.versions.item
        )
          ? versionsResult.items.item.versions.item
          : [versionsResult.items.item.versions.item];

        console.log("Found versions:", versionItems.length);

        // 日本語版を探す
        const japaneseVersion = versionItems.find((v: any) => {
          const versionName = v.name?.["@_value"] || "";
          const versionNickname =
            v.nameid?.["@_type"] === "primary" ? v.nameid["#text"] : "";

          // 日本語版かどうかを判定するための条件を強化
          const hasJapaneseChars = versionName.match(
            /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
          );
          const containsJapanKeyword =
            versionName.toLowerCase().includes("japanese") ||
            versionName.toLowerCase().includes("japan") ||
            versionName.toLowerCase().includes("日本語") ||
            versionNickname.toLowerCase().includes("japanese") ||
            versionNickname.toLowerCase().includes("japan") ||
            versionNickname.toLowerCase().includes("日本語");

          // 日本の出版社が含まれているかチェック
          let hasJapanesePublisher = false;
          if (v.link) {
            const links = Array.isArray(v.link) ? v.link : [v.link];
            hasJapanesePublisher = links.some((link: any) => {
              if (link["@_type"] === "boardgamepublisher") {
                const publisherName = link["@_value"] || "";
                return (
                  publisherName.match(
                    /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
                  ) ||
                  publisherName.includes("Japan") ||
                  publisherName.includes("Hobby Japan") ||
                  publisherName.includes("Arclight") ||
                  publisherName.includes("アークライト") ||
                  publisherName.includes("ホビージャパン")
                );
              }
              return false;
            });
          }

          return (
            hasJapaneseChars || containsJapanKeyword || hasJapanesePublisher
          );
        });

        if (japaneseVersion) {
          console.log("Found Japanese version:", japaneseVersion);

          // バージョンIDを取得
          const versionId = japaneseVersion["@_id"];

          // バージョン詳細情報を取得
          try {
            const versionDetailXml = await fetchWithRetry(
              `${BGG_API_BASE}/version?id=${versionId}`
            );
            const versionDetailResult = parser.parse(versionDetailXml);

            if (versionDetailResult.items?.item) {
              const versionDetail = versionDetailResult.items.item;

              // 日本語名を取得
              const versionJapaneseName = versionDetail.name?.["@_value"];
              console.log("Version Japanese name:", versionJapaneseName);

              // 出版社を取得
              const versionPublishers = versionDetail.link
                ? Array.isArray(versionDetail.link)
                  ? versionDetail.link
                      .filter(
                        (link: any) => link["@_type"] === "boardgamepublisher"
                      )
                      .map((link: any) => link["@_value"])
                  : versionDetail.link["@_type"] === "boardgamepublisher"
                  ? [versionDetail.link["@_value"]]
                  : []
                : [];
              console.log("Version publishers:", versionPublishers);

              // 発売日を取得
              const versionReleaseDate = versionDetail.releasedate;
              console.log("Version release date:", versionReleaseDate);

              // 画像URLを取得
              const versionImageUrl =
                versionDetail.image || versionDetail.thumbnail;
              console.log("Version image URL:", versionImageUrl);

              japaneseVersionInfo = {
                name: versionJapaneseName,
                publisher: versionPublishers[0],
                releaseDate: versionReleaseDate,
                imageUrl: versionImageUrl,
              };

              // 日本語名が見つかった場合は設定
              if (versionJapaneseName) {
                japaneseImage = japaneseImage || versionImageUrl;
              }

              // 画像URLが取得できない場合は、BGGの画像ギャラリーを検索して日本語版の画像を探す
              if (!japaneseVersionInfo.imageUrl && japaneseVersionInfo.name) {
                try {
                  const japaneseImageUrl = await searchJapaneseVersionImage(
                    id,
                    japaneseVersionInfo.name
                  );
                  if (japaneseImageUrl) {
                    console.log(
                      "Found Japanese version image through search:",
                      japaneseImageUrl
                    );
                    japaneseVersionInfo.imageUrl = japaneseImageUrl;
                    japaneseImage = japaneseImageUrl;
                  }
                } catch (imageError) {
                  console.error(
                    "Error searching Japanese version image:",
                    imageError
                  );
                }
              }
            }
          } catch (versionError) {
            console.error("Error fetching version details:", versionError);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching Japanese version info:", error);
    }

    // デザイナー情報を取得
    const designers = (item.link || [])
      .filter((link: any) => link["@_type"] === "boardgamedesigner")
      .map((link: any) => link["@_value"]);

    // 発売年を取得
    const releaseDate = item.yearpublished?.["@_value"]
      ? `${item.yearpublished["@_value"]}-01-01`
      : undefined;

    // 日本語版の発売日
    let japaneseReleaseDate;
    if (japaneseVersionInfo && japaneseVersionInfo.releaseDate) {
      japaneseReleaseDate = japaneseVersionInfo.releaseDate;
    } else {
      // 日本語版の発売日がない場合は、元の発売日を使用
      japaneseReleaseDate = releaseDate;
    }

    // 最終的な日本語名を決定
    const finalJapaneseName = japaneseVersionInfo?.name || japaneseName;
    console.log("Final Japanese name:", finalJapaneseName);

    // 最終的な日本語出版社を決定
    const finalJapanesePublisher =
      japaneseVersionInfo?.publisher || japanesePublisher;
    console.log("Final Japanese publisher:", finalJapanesePublisher);

    // 最終的な日本語版画像URLを決定
    const finalJapaneseImageUrl =
      japaneseVersionInfo?.imageUrl || japaneseImage;
    console.log("Final Japanese image URL:", finalJapaneseImageUrl);

    // 拡張情報を取得
    const expansions = (item.link || [])
      .filter(
        (link: any) =>
          link["@_type"] === "boardgameexpansion" &&
          link["@_inbound"] === "true"
      )
      .map((link: any) => ({
        id: link["@_id"],
        name: link["@_value"],
      }));

    // ベースゲーム情報を取得
    const baseGameLinks = (item.link || []).filter(
      (link: any) =>
        link["@_type"] === "boardgameexpansion" && link["@_inbound"] !== "true"
    );

    const baseGame =
      baseGameLinks.length > 0
        ? { id: baseGameLinks[0]["@_id"], name: baseGameLinks[0]["@_value"] }
        : undefined;

    return {
      id: item["@_id"],
      name: primaryName,
      description: item.description?.replace(/&#10;/g, "\n") || "",
      image: item.image || item.thumbnail || "",
      japaneseImage: finalJapaneseImageUrl,
      minPlayers: parseInt(item.minplayers?.["@_value"]) || 0,
      maxPlayers: parseInt(item.maxplayers?.["@_value"]) || 0,
      minPlayTime: parseInt(item.minplaytime?.["@_value"]) || 0,
      maxPlayTime:
        parseInt(item.maxplaytime?.["@_value"]) ||
        parseInt(item.playingtime?.["@_value"]) ||
        0,
      yearPublished: parseInt(item.yearpublished?.["@_value"]) || 0,
      averageRating:
        parseFloat(item.statistics?.ratings?.average?.["@_value"]) || 0,
      weight: weight,
      bestPlayers,
      recommendedPlayers,
      mechanics: (item.link || [])
        .filter((link: any) => link["@_type"] === "boardgamemechanic")
        .map((link: any) => link["@_value"]),
      categories: (item.link || [])
        .filter((link: any) => link["@_type"] === "boardgamecategory")
        .map((link: any) => link["@_value"]),
      publisher: publishers.length > 0 ? publishers[0] : undefined,
      designer: designers.length > 0 ? designers[0] : undefined,
      releaseDate,
      japanesePublisher: finalJapanesePublisher,
      japaneseReleaseDate: japaneseReleaseDate,
      japaneseName: finalJapaneseName,
      expansions: expansions.length > 0 ? expansions : undefined,
      baseGame,
    };
  } catch (error) {
    console.error("Error fetching BGG game details:", error);
    throw new Error("BGGからのゲーム情報の取得に失敗しました");
  }
}

export async function getHotGames(): Promise<BGGGameDetails[]> {
  try {
    const hotXml = await fetchWithRetry(`${BGG_API_BASE}/hot?type=boardgame`);
    const hotResult = parser.parse(hotXml);

    if (!hotResult.items?.item) {
      return [];
    }

    const hotItems = Array.isArray(hotResult.items.item)
      ? hotResult.items.item
      : [hotResult.items.item];

    const gameIds = hotItems
      .slice(0, 20)
      .map((item: any) => item["@_id"])
      .join(",");

    const gamesXml = await fetchWithRetry(
      `${BGG_API_BASE}/thing?id=${gameIds}&stats=1`
    );
    const gamesResult = parser.parse(gamesXml);

    if (!gamesResult.items?.item) {
      return [];
    }

    const items = Array.isArray(gamesResult.items.item)
      ? gamesResult.items.item
      : [gamesResult.items.item];

    return items.map((item: any) => {
      const minPlayTime = parseInt(item.minplaytime?.["@_value"]) || 0;
      const maxPlayTime =
        parseInt(item.maxplaytime?.["@_value"]) ||
        parseInt(item.playingtime?.["@_value"]) ||
        0;

      // 拡張情報を取得
      const expansions = (item.link || [])
        .filter(
          (link: any) =>
            link["@_type"] === "boardgameexpansion" &&
            link["@_inbound"] === "true"
        )
        .map((link: any) => ({
          id: link["@_id"],
          name: link["@_value"],
        }));

      // ベースゲーム情報を取得
      const baseGameLinks = (item.link || []).filter(
        (link: any) =>
          link["@_type"] === "boardgameexpansion" &&
          link["@_inbound"] !== "true"
      );

      const baseGame =
        baseGameLinks.length > 0
          ? { id: baseGameLinks[0]["@_id"], name: baseGameLinks[0]["@_value"] }
          : undefined;

      return {
        id: item["@_id"],
        name: Array.isArray(item.name)
          ? item.name.find((n: any) => n["@_type"] === "primary")["@_value"]
          : item.name["@_value"],
        description: item.description?.replace(/&#10;/g, "\n") || "",
        image: item.image || "",
        minPlayers: parseInt(item.minplayers?.["@_value"]) || 0,
        maxPlayers: parseInt(item.maxplayers?.["@_value"]) || 0,
        minPlayTime,
        maxPlayTime,
        yearPublished: parseInt(item.yearpublished?.["@_value"]) || 0,
        averageRating:
          parseFloat(item.statistics?.ratings?.average?.["@_value"]) || 0,
        mechanics: (item.link || [])
          .filter((link: any) => link["@_type"] === "boardgamemechanic")
          .map((link: any) => link["@_value"]),
        categories: (item.link || [])
          .filter((link: any) => link["@_type"] === "boardgamecategory")
          .map((link: any) => link["@_value"]),
        weight:
          parseFloat(item.statistics?.ratings?.averageweight?.["@_value"]) || 0,
        bestPlayers: [],
        recommendedPlayers: [],
        expansions: expansions.length > 0 ? expansions : undefined,
        baseGame,
      };
    });
  } catch (error) {
    console.error("Error fetching hot games:", error);
    return [];
  }
}

export async function getGameDetails(id: string): Promise<BGGGameDetails> {
  try {
    const games = await getGamesDetails(id);
    return games[0];
  } catch (error) {
    console.error(`Error fetching game ${id}:`, error);
    throw error;
  }
}

async function getGamesDetails(ids: string): Promise<BGGGameDetails[]> {
  try {
    console.log("Fetching game details for IDs:", ids);
    const { data: xml } = await axios.get(
      `${BGG_API_BASE}/thing?id=${ids}&stats=1`
    );
    console.log("Game details XML:", xml);
    const result = parser.parse(xml);
    console.log("Parsed game details:", result);

    if (!result.items?.item) {
      console.log("No items found in game details");
      return [];
    }

    const items = Array.isArray(result.items.item)
      ? result.items.item
      : [result.items.item];

    return items
      .map((item: any) => {
        try {
          // 拡張情報を取得
          const expansions = (item.link || [])
            .filter(
              (link: any) =>
                link["@_type"] === "boardgameexpansion" &&
                link["@_inbound"] === "true"
            )
            .map((link: any) => ({
              id: link["@_id"],
              name: link["@_value"],
            }));

          // ベースゲーム情報を取得
          const baseGameLinks = (item.link || []).filter(
            (link: any) =>
              link["@_type"] === "boardgameexpansion" &&
              link["@_inbound"] !== "true"
          );

          const baseGame =
            baseGameLinks.length > 0
              ? {
                  id: baseGameLinks[0]["@_id"],
                  name: baseGameLinks[0]["@_value"],
                }
              : undefined;

          return {
            id: item["@_id"],
            name: Array.isArray(item.name)
              ? item.name.find((n: any) => n["@_type"] === "primary")["@_value"]
              : item.name["@_value"],
            description: item.description?.replace(/&#10;/g, "\n") || "",
            image: item.image || "",
            minPlayers: parseInt(item.minplayers?.["@_value"]) || 0,
            maxPlayers: parseInt(item.maxplayers?.["@_value"]) || 0,
            minPlayTime: parseInt(item.minplaytime?.["@_value"]) || 0,
            maxPlayTime:
              parseInt(item.maxplaytime?.["@_value"]) ||
              parseInt(item.playingtime?.["@_value"]) ||
              0,
            yearPublished: parseInt(item.yearpublished?.["@_value"]) || 0,
            averageRating:
              parseFloat(item.statistics?.ratings?.average?.["@_value"]) || 0,
            mechanics: (item.link || [])
              .filter((link: any) => link["@_type"] === "boardgamemechanic")
              .map((link: any) => link["@_value"]),
            categories: (item.link || [])
              .filter((link: any) => link["@_type"] === "boardgamecategory")
              .map((link: any) => link["@_value"]),
            weight:
              parseFloat(
                item.statistics?.ratings?.averageweight?.["@_value"]
              ) || 0,
            bestPlayers: [],
            recommendedPlayers: [],
            expansions: expansions.length > 0 ? expansions : undefined,
            baseGame,
          };
        } catch (error) {
          console.error("Error parsing game item:", error, item);
          return null;
        }
      })
      .filter((game): game is BGGGameDetails => game !== null);
  } catch (error) {
    console.error("Error fetching game details:", error);
    return [];
  }
}

export async function fetchBGGData(query: string): Promise<string> {
  const response = await fetch(`https://boardgamegeek.com/xmlapi2/${query}`);
  if (!response.ok) {
    throw new Error("BGGからのデータ取得に失敗しました");
  }
  return response.text();
}

export function parseXMLResponse(xmlText: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xmlText, "text/xml");
}

export { type BGGGameDetails };
