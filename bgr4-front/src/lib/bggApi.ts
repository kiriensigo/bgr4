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
  minPlayers: number;
  maxPlayers: number;
  playTime: number;
  yearPublished?: number;
  averageRating?: number;
  mechanics?: string[];
  categories?: string[];
  weight: number;
  bestPlayers: string[];
  recommendedPlayers: string[];
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
    const name = Array.isArray(item.name)
      ? item.name.find((n: any) => n["@_type"] === "primary")["@_value"]
      : item.name["@_value"];

    return {
      id: item["@_id"],
      name: name,
      description: item.description?.replace(/&#10;/g, "\n") || "",
      image: item.image || item.thumbnail || "",
      minPlayers: parseInt(item.minplayers?.["@_value"]) || 0,
      maxPlayers: parseInt(item.maxplayers?.["@_value"]) || 0,
      playTime: parseInt(item.playingtime?.["@_value"]) || 0,
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

    return items.map((item: any) => ({
      id: item["@_id"],
      name: Array.isArray(item.name)
        ? item.name.find((n: any) => n["@_type"] === "primary")["@_value"]
        : item.name["@_value"],
      description: item.description?.replace(/&#10;/g, "\n") || "",
      image: item.image || "",
      minPlayers: parseInt(item.minplayers?.["@_value"]) || 0,
      maxPlayers: parseInt(item.maxplayers?.["@_value"]) || 0,
      playTime: parseInt(item.playingtime?.["@_value"]) || 0,
      yearPublished: parseInt(item.yearpublished?.["@_value"]) || 0,
      averageRating:
        parseFloat(item.statistics?.ratings?.average?.["@_value"]) || 0,
      mechanics: (item.link || [])
        .filter((link: any) => link["@_type"] === "boardgamemechanic")
        .map((link: any) => link["@_value"]),
      categories: (item.link || [])
        .filter((link: any) => link["@_type"] === "boardgamecategory")
        .map((link: any) => link["@_value"]),
    }));
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
          return {
            id: item["@_id"],
            name: Array.isArray(item.name)
              ? item.name.find((n: any) => n["@_type"] === "primary")["@_value"]
              : item.name["@_value"],
            description: item.description?.replace(/&#10;/g, "\n") || "",
            image: item.image || "",
            minPlayers: parseInt(item.minplayers?.["@_value"]) || 0,
            maxPlayers: parseInt(item.maxplayers?.["@_value"]) || 0,
            playTime: parseInt(item.playingtime?.["@_value"]) || 0,
            yearPublished: parseInt(item.yearpublished?.["@_value"]) || 0,
            averageRating:
              parseFloat(item.statistics?.ratings?.average?.["@_value"]) || 0,
            mechanics: (item.link || [])
              .filter((link: any) => link["@_type"] === "boardgamemechanic")
              .map((link: any) => link["@_value"]),
            categories: (item.link || [])
              .filter((link: any) => link["@_type"] === "boardgamecategory")
              .map((link: any) => link["@_value"]),
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
