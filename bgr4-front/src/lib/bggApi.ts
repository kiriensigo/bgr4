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
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // BGG APIのURLかどうかを確認
      if (url.startsWith(BGG_API_BASE) && url.includes("/version?id=")) {
        // バージョン詳細情報の場合は、CORSエラーを回避するために
        // バージョン情報をバージョンリストから直接取得する
        console.log(
          "Using version info from version list instead of direct API call to avoid CORS issues"
        );
        return `<items><item></item></items>`;
      }

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
    console.log(
      `Searching Japanese version image for game ${id} with name ${japaneseName}`
    );

    // BGGの画像ギャラリーを検索
    try {
      const galleryXml = await fetchWithRetry(
        `${BGG_API_BASE}/images?thing=${id}`
      );
      const galleryResult = parser.parse(galleryXml);

      if (!galleryResult.items?.item) {
        console.log("No images found in gallery");
        return null;
      }

      const imageItems = Array.isArray(galleryResult.items.item)
        ? galleryResult.items.item
        : [galleryResult.items.item];

      console.log(`Found ${imageItems.length} images in gallery`);

      // 日本語版の画像を探す（キャプションに日本語が含まれているか、「Japanese」「Japan」などのキーワードが含まれている画像）
      // 優先順位をつけて検索
      const japaneseKeywords = [
        japaneseName, // 日本語名と完全一致
        "日本語版",
        "日本語",
        "Japanese version",
        "Japanese edition",
        "Japan version",
        "Japan edition",
        "Japanese",
        "Japan",
      ];

      // 最も優先度の高いキーワードから順に検索
      for (const keyword of japaneseKeywords) {
        for (const image of imageItems) {
          const caption = image.caption || "";

          if (caption.includes(keyword)) {
            const imageUrl = image.large || image.medium || image.small;
            console.log(
              `Found Japanese version image with caption "${caption}" matching keyword "${keyword}"`
            );
            return imageUrl;
          }
        }
      }

      // キーワード検索で見つからなかった場合は、日本語文字が含まれている画像を探す
      for (const image of imageItems) {
        const caption = image.caption || "";

        // 日本語文字が含まれているか確認
        if (caption.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)) {
          const imageUrl = image.large || image.medium || image.small;
          console.log(
            `Found Japanese version image with Japanese characters in caption: "${caption}"`
          );
          return imageUrl;
        }
      }

      // 日本語版の画像が見つからなかった場合は、最新の画像を返す（多くの場合、最新の画像が最も品質が良い）
      if (imageItems.length > 0) {
        // 画像IDで降順ソート（最新の画像が先頭に来るように）
        const sortedImages = [...imageItems].sort((a, b) => {
          const idA = parseInt(a["@_id"] || "0");
          const idB = parseInt(b["@_id"] || "0");
          return idB - idA;
        });

        // 最新の画像を返す
        const latestImage = sortedImages[0];
        const imageUrl =
          latestImage.large || latestImage.medium || latestImage.small;
        console.log(
          `No Japanese version image found, using latest image with ID ${latestImage["@_id"]}`
        );
        return imageUrl;
      }
    } catch (galleryError) {
      console.error("Error fetching gallery images:", galleryError);
      console.log("Continuing without gallery images");
    }

    console.log("No suitable image found");
    return null;
  } catch (error) {
    console.error("Error searching Japanese version image:", error);
    return null;
  }
}

// バージョンIDを使って詳細情報を取得する関数
async function getVersionDetails(versionId: string): Promise<{
  name?: string;
  publisher?: string;
  releaseDate?: string;
  imageUrl?: string;
} | null> {
  try {
    console.log(`Fetching version details for version ID: ${versionId}`);

    // バージョン詳細ページのHTMLを直接取得
    const versionUrl = `https://boardgamegeek.com/boardgameversion/${versionId}`;
    const response = await axios.get(versionUrl);

    if (!response.data) {
      console.log("No data returned from version details page");
      return null;
    }

    // HTMLを解析
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(response.data, "text/html");

    // 日本語名を取得（ページタイトルから）
    const titleElement = htmlDoc.querySelector("title");
    let japaneseName = null;

    if (titleElement) {
      const titleText = titleElement.textContent || "";
      // タイトルから日本語名を抽出（例: "マイシティ | Board Game Version | BoardGameGeek"）
      const titleMatch = titleText.match(/^([^\|]+)/);
      if (titleMatch && titleMatch[1]) {
        const potentialName = titleMatch[1].trim();
        // 実際に日本語文字を含むか確認
        if (potentialName.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)) {
          japaneseName = potentialName;
          console.log(
            `Found Japanese name from version page title: ${japaneseName}`
          );
        }
      }
    }

    // 出版社情報を取得
    const publisherElements = Array.from(
      htmlDoc.querySelectorAll(".game-header-linked-items a")
    ).filter((el) => el.getAttribute("href")?.includes("boardgamepublisher"));

    const publisher =
      publisherElements.length > 0
        ? publisherElements[0].textContent?.trim()
        : undefined;

    // 発売日を取得
    let releaseDate = undefined;
    const gameplayItems = Array.from(
      htmlDoc.querySelectorAll(".game-header-body .gameplay-item")
    );

    for (const item of gameplayItems) {
      const itemText = item.textContent || "";
      if (itemText.includes("Published")) {
        const dateText = itemText.replace("Published", "").trim();
        // 年だけの場合は1月1日を追加
        if (/^\d{4}$/.test(dateText)) {
          releaseDate = `${dateText}-01-01`;
        } else {
          // 日付形式を解析して標準形式に変換
          try {
            const dateObj = new Date(dateText);
            if (!isNaN(dateObj.getTime())) {
              releaseDate = dateObj.toISOString().split("T")[0];
            }
          } catch (e) {
            // 解析できない場合は年だけ抽出
            const yearMatch = dateText.match(/\b(\d{4})\b/);
            releaseDate = yearMatch ? `${yearMatch[1]}-01-01` : undefined;
          }
        }
        break;
      }
    }

    // 画像URLを取得
    let imageUrl = undefined;
    const galleryLink = htmlDoc.querySelector('a[href*="/images/version/"]');

    if (galleryLink) {
      const galleryUrl = `https://boardgamegeek.com${galleryLink.getAttribute(
        "href"
      )}`;
      const galleryResponse = await axios.get(galleryUrl);

      if (galleryResponse.data) {
        const galleryDoc = parser.parseFromString(
          galleryResponse.data,
          "text/html"
        );
        const imageLink = galleryDoc.querySelector(".gallery-item a");

        if (imageLink) {
          const imageDetailUrl = `https://boardgamegeek.com${imageLink.getAttribute(
            "href"
          )}`;
          const imageDetailResponse = await axios.get(imageDetailUrl);

          if (imageDetailResponse.data) {
            const imageDetailDoc = parser.parseFromString(
              imageDetailResponse.data,
              "text/html"
            );
            const actualImage = imageDetailDoc.querySelector(".img-responsive");

            if (actualImage) {
              imageUrl = actualImage.getAttribute("src") || undefined;
              console.log(`Found image URL from version gallery: ${imageUrl}`);
            }
          }
        }
      }
    }

    return {
      name: japaneseName || undefined,
      publisher,
      releaseDate,
      imageUrl,
    };
  } catch (error) {
    console.error(
      `Error getting version details for version ID ${versionId}:`,
      error
    );
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

        // 投票結果を取得
        const bestVotes = parseInt(
          votes.find((v: any) => v["@_value"] === "Best")?.["@_numvotes"] || "0"
        );
        const recommendedVotes = parseInt(
          votes.find((v: any) => v["@_value"] === "Recommended")?.[
            "@_numvotes"
          ] || "0"
        );
        const notRecommendedVotes = parseInt(
          votes.find((v: any) => v["@_value"] === "Not Recommended")?.[
            "@_numvotes"
          ] || "0"
        );

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

    // 「Japanese edition」などの英語表記を除外するための関数
    const isActualJapaneseName = (name: string | undefined): boolean => {
      if (!name) return false;

      // 実際に日本語文字（ひらがな、カタカナ、漢字）を含むか確認
      const containsJapaneseChars = !!name.match(
        /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
      );

      // 「Japanese」「Japan」などの英語表記のみの場合は除外
      const isOnlyEnglishJapaneseReference =
        !containsJapaneseChars &&
        (name.toLowerCase().includes("japanese") ||
          name.toLowerCase().includes("japan edition") ||
          name.toLowerCase().includes("japan version"));

      return containsJapaneseChars && !isOnlyEnglishJapaneseReference;
    };

    console.log(
      "All names:",
      names.map((n: any) => ({ type: n["@_type"], value: n["@_value"] }))
    );
    console.log("Japanese name detected from alternate names:", japaneseName);
    console.log("Is actual Japanese name:", isActualJapaneseName(japaneseName));

    // 出版社情報を取得
    const publishers = (item.link || [])
      .filter((link: any) => link["@_type"] === "boardgamepublisher")
      .map((link: any) => link["@_value"]);

    // 日本語版の出版社を探す（日本の出版社名を含むものを探す）
    const japanesePublishers = publishers.filter(
      (publisher: string) =>
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
    // 現在は使用していないが、将来的に使用する可能性があるためコメントアウト
    /* const images = Array.isArray(item.image)
      ? item.image
      : item.image
      ? [item.image]
      : [];
    const thumbnails = Array.isArray(item.thumbnail)
      ? item.thumbnail
      : item.thumbnail
      ? [item.thumbnail]
      : []; */

    // 日本語版の情報を取得
    let japaneseVersionInfo: any = null;
    if (item.versions && item.versions.item) {
      try {
        console.log("Checking for Japanese version in version list");

        // 複数のバージョンがある場合は配列に変換
        const versions = Array.isArray(item.versions.item)
          ? item.versions.item
          : [item.versions.item];

        // 日本語版を探す
        let japaneseVersion = null;
        let versionId = null;

        for (const version of versions) {
          const versionName = version.name?.["@_value"] || "";

          // 日本語版かどうかを判定
          const hasJapaneseChars = !!versionName.match(
            /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
          );

          const containsJapanKeyword =
            versionName.toLowerCase().includes("japanese") ||
            versionName.toLowerCase().includes("japan") ||
            versionName.toLowerCase().includes("日本語");

          // 日本の出版社が含まれているか確認
          let hasJapanesePublisher = false;
          const versionPublishers = [];

          if (version.link) {
            const links = Array.isArray(version.link)
              ? version.link
              : [version.link];

            for (const link of links) {
              if (link["@_type"] === "boardgamepublisher") {
                const publisherName = link["@_value"];
                versionPublishers.push(publisherName);

                if (
                  publisherName.match(
                    /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
                  ) ||
                  publisherName.includes("Hobby Japan") ||
                  publisherName.includes("Arclight") ||
                  publisherName.includes("Ten Days Games")
                ) {
                  hasJapanesePublisher = true;
                  break;
                }
              }
            }
          }

          // 日本語版と判定する条件
          const isJapaneseVersion =
            hasJapaneseChars || (containsJapanKeyword && hasJapanesePublisher);

          if (isJapaneseVersion) {
            japaneseVersion = version;
            versionId = version["@_id"];
            break;
          }
        }

        // 日本語版が見つかった場合
        if (japaneseVersion) {
          try {
            console.log("Found Japanese version:", japaneseVersion);

            // バージョン情報から日本語名を取得
            let versionJapaneseName = japaneseVersion.name?.["@_value"];

            // nameidから日本語名を取得（BGGのバージョンページでは「Name」フィールドに相当）
            if (japaneseVersion.nameid) {
              const nameids = Array.isArray(japaneseVersion.nameid)
                ? japaneseVersion.nameid
                : [japaneseVersion.nameid];

              for (const nameid of nameids) {
                const nameidType = nameid["@_type"];
                const nameidValue = nameid["#text"];

                console.log(
                  `Checking nameid: ${nameidValue}, type: ${nameidType}`
                );

                // 「primary」タイプのnameidが実際の日本語名の可能性が高い
                if (
                  nameidType === "primary" &&
                  nameidValue &&
                  nameidValue.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
                ) {
                  versionJapaneseName = nameidValue;
                  console.log(
                    `Found actual Japanese name from nameid: ${versionJapaneseName}`
                  );
                  break;
                }
              }
            }

            // 出版社情報を取得
            const versionPublishers = [];

            if (japaneseVersion.link) {
              const links = Array.isArray(japaneseVersion.link)
                ? japaneseVersion.link
                : [japaneseVersion.link];

              for (const link of links) {
                if (link["@_type"] === "boardgamepublisher") {
                  versionPublishers.push(link["@_value"]);
                }
              }
            }

            // 発売日の処理を改善
            let versionReleaseDate = undefined;
            if (japaneseVersion.yearpublished?.["@_value"]) {
              // 年だけの場合は1月1日を追加
              versionReleaseDate = `${japaneseVersion.yearpublished["@_value"]}-01-01`;
              console.log("Version release date:", versionReleaseDate);
            }

            // 画像URLを取得
            let versionImageUrl =
              japaneseVersion.image?.["#text"] ||
              japaneseVersion.thumbnail?.["#text"];
            console.log("Version image URL:", versionImageUrl);

            // バージョンIDがあれば、バージョン詳細ページから追加情報を取得
            if (versionId) {
              console.log(
                `Fetching additional details for version ID: ${versionId}`
              );
              const versionDetails = await getVersionDetails(versionId);

              if (versionDetails) {
                // バージョン詳細から取得した情報で上書き（undefinedでない場合のみ）
                if (versionDetails.name) {
                  versionJapaneseName = versionDetails.name;
                  console.log(
                    `Updated Japanese name from version details: ${versionJapaneseName}`
                  );
                }

                if (versionDetails.publisher) {
                  versionPublishers[0] = versionDetails.publisher;
                  console.log(
                    `Updated publisher from version details: ${versionDetails.publisher}`
                  );
                }

                if (versionDetails.releaseDate) {
                  versionReleaseDate = versionDetails.releaseDate;
                  console.log(
                    `Updated release date from version details: ${versionReleaseDate}`
                  );
                }

                if (versionDetails.imageUrl) {
                  versionImageUrl = versionDetails.imageUrl;
                  console.log(
                    `Updated image URL from version details: ${versionImageUrl}`
                  );
                }
              }
            }

            // 日本語版情報をまとめる
            japaneseVersionInfo = {
              name: versionJapaneseName,
              publisher:
                versionPublishers.length > 0 ? versionPublishers[0] : undefined,
              releaseDate: versionReleaseDate,
              imageUrl: versionImageUrl,
            };

            console.log(
              "Japanese version info from version list:",
              japaneseVersionInfo
            );
          } catch (versionError) {
            console.error(
              "Error processing Japanese version info:",
              versionError
            );
          }
        }
      } catch (error) {
        console.error("Error fetching Japanese version info:", error);
      }
    }

    // 日本語版の画像が見つからなかった場合は、代替名から日本語名を取得して画像を検索
    if (!japaneseImage && japaneseName) {
      try {
        console.log(
          "Japanese image not found from version info, searching with alternate name:",
          japaneseName
        );
        const japaneseImageUrl = await searchJapaneseVersionImage(
          id,
          japaneseName
        );
        if (japaneseImageUrl) {
          console.log(
            "Found Japanese version image using alternate name:",
            japaneseImageUrl
          );
          japaneseImage = japaneseImageUrl;
        }
      } catch (imageError) {
        console.error(
          "Error searching Japanese version image with alternate name:",
          imageError
        );
      }
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
      console.log("Using Japanese version release date:", japaneseReleaseDate);
    } else {
      // 日本語版の発売日がない場合は、元の発売日を使用
      japaneseReleaseDate = releaseDate;
      console.log(
        "Using original release date for Japanese version:",
        japaneseReleaseDate
      );
    }

    // 最終的な日本語名を決定
    let finalJapaneseName = japaneseVersionInfo?.name || japaneseName;

    // 「Japanese edition」などの英語表記のみの場合は、日本語名として扱わない
    if (finalJapaneseName && !isActualJapaneseName(finalJapaneseName)) {
      console.log(
        "Final Japanese name is not an actual Japanese name, ignoring it"
      );
      finalJapaneseName = undefined;
    }

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
      .map(async (id: string) => {
        try {
          return await getGameDetails(id);
        } catch (error) {
          console.error(`Error fetching game ${id}:`, error);
          return null;
        }
      })
      .filter(
        (game: BGGGameDetails | null): game is BGGGameDetails => game !== null
      );
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
