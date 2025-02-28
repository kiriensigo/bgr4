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

    // 特定のゲームIDに対する日本語名のマッピング
    const japaneseNameMapping: Record<string, string> = {
      "279537": "惑星Xの探索", // The Search for Planet X
      "171623": "マルコポーロの旅路", // The Voyages of Marco Polo
      "364073": "宝石の煌き：デュエル", // Splendor Duel
    };

    // マッピングに存在する場合はそれを使用し、なければ検出した日本語名を使用
    const mappedJapaneseName = japaneseNameMapping[id] || japaneseName;

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

    // 特定のゲームIDに対する日本語出版社のマッピング
    const japanesePublisherMapping: Record<string, string> = {
      "279537": "数寄ゲームズ (Suki Games)", // The Search for Planet X
      "171623": "ホビージャパン (Hobby Japan)", // The Voyages of Marco Polo
      "364073": "ホビージャパン (Hobby Japan)", // Splendor Duel
    };

    // 特定のゲームIDに対する日本語版の発売日のマッピング
    const japaneseReleaseDateMapping: Record<string, string> = {
      "364073": "2022-11-24", // Splendor Duel
    };

    // 特定のゲームIDに対する日本語版の画像URLのマッピング
    const japaneseImageUrlMapping: Record<string, string> = {
      "364073":
        "https://cf.geekdo-images.com/7197608/img/Wd9BKlmPhKcnYJBBDfKYGQYYjlQ=/fit-in/246x300/filters:strip_icc()/pic7197608.jpg", // Splendor Duel
    };

    // マッピングに存在する場合はそれを使用し、なければ検出した日本語出版社を使用
    const mappedJapanesePublisher =
      japanesePublisherMapping[id] ||
      (japanesePublishers.length > 0 ? japanesePublishers[0] : undefined);

    // 日本語版の画像を探す
    let japaneseImage: string | undefined = japaneseImageUrlMapping[id];

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

        // 日本語版を探す
        const japaneseVersion = versionItems.find((v: any) => {
          const versionName = v.name?.["@_value"] || "";
          const versionNickname =
            v.nameid?.["@_type"] === "primary" ? v.nameid["#text"] : "";

          return (
            versionName.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/) ||
            versionName.includes("Japanese") ||
            versionName.includes("Japan") ||
            versionNickname.includes("Japanese") ||
            versionNickname.includes("Japan") ||
            versionNickname.includes("日本語")
          );
        });

        if (japaneseVersion) {
          console.log("Found Japanese version:", japaneseVersion);

          // バージョンIDを取得
          const versionId = japaneseVersion["@_id"];

          // バージョン詳細情報を取得
          const versionDetailXml = await fetchWithRetry(
            `${BGG_API_BASE}/version?id=${versionId}`
          );
          const versionDetailResult = parser.parse(versionDetailXml);

          if (versionDetailResult.items?.item) {
            const versionDetail = versionDetailResult.items.item;

            // 日本語名を取得
            const versionJapaneseName = versionDetail.name?.["@_value"];

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

            // 発売日を取得
            const versionReleaseDate = versionDetail.releasedate;

            // 画像URLを取得
            const versionImageUrl = versionDetail.image;

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
    let japaneseReleaseDate = japaneseReleaseDateMapping[id];
    if (!japaneseReleaseDate) {
      if (japaneseVersionInfo && japaneseVersionInfo.releaseDate) {
        japaneseReleaseDate = japaneseVersionInfo.releaseDate;
      } else if (mappedJapaneseName && releaseDate) {
        // 日本語名があるが日本語版の発売日がない場合は、同じ値を使用
        japaneseReleaseDate = releaseDate;
      }
    }

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
      japaneseImage,
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
      japanesePublisher:
        japaneseVersionInfo && japaneseVersionInfo.publisher
          ? japaneseVersionInfo.publisher
          : mappedJapanesePublisher,
      japaneseReleaseDate,
      japaneseName:
        japaneseVersionInfo && japaneseVersionInfo.name
          ? japaneseVersionInfo.name
          : mappedJapaneseName,
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
