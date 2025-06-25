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
  expansions?: Array<{ id: string; name: string; type: string }>;
  isExpansion: boolean;
  baseGame?: { id: string; name: string };
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
export async function searchJapaneseVersionImage(
  gameId: string
): Promise<string | null> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `Searching for Japanese version image for game ID: ${gameId}`
      );
    }

    // BGG APIからゲーム詳細を取得
    const { data: xml } = await axios.get(
      `${BGG_API_BASE}/thing?id=${gameId}&versions=1`
    );
    const result = parser.parse(xml);

    if (!result.items?.item) {
      if (process.env.NODE_ENV === "development") {
        console.log("No items found for game");
      }
      return null;
    }

    const game = Array.isArray(result.items.item)
      ? result.items.item[0]
      : result.items.item;

    // バージョン情報を取得
    const versions = game.versions?.version;
    if (!versions) {
      if (process.env.NODE_ENV === "development") {
        console.log("No versions found for game");
      }
      return null;
    }

    const versionList = Array.isArray(versions) ? versions : [versions];

    // 日本語版を検索
    for (const version of versionList) {
      if (
        version.link &&
        version.link.some(
          (link: any) =>
            link.value?.toLowerCase().includes("japan") ||
            link.value?.toLowerCase().includes("japanese") ||
            link.value?.includes("日本")
        )
      ) {
        const versionId = version.id;
        if (process.env.NODE_ENV === "development") {
          console.log(`Found Japanese version with ID: ${versionId}`);
        }

        // 日本語版の詳細情報を取得
        const imageUrl = await getVersionImageUrl(versionId);
        if (imageUrl) {
          return imageUrl;
        }
      }
    }

    // 日本語版が見つからない場合はメイン画像を返す
    const mainImageUrl = game.image;
    if (process.env.NODE_ENV === "development") {
      console.log("No Japanese version found, using main image");
    }
    return mainImageUrl || null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error searching Japanese version image:", error);
    }
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

        // ひらがなまたはカタカナを含むか確認（最優先）
        const hasKana = !!potentialName.match(/[\u3040-\u309F\u30A0-\u30FF]/);

        // 漢字のみを含むか確認
        const hasKanjiOnly =
          !hasKana && !!potentialName.match(/[\u4E00-\u9FAF]/);

        // 「Japanese」「Japan」などの英語表記を含むか確認
        const containsJapanKeyword =
          potentialName.toLowerCase().includes("japanese") ||
          potentialName.toLowerCase().includes("japan") ||
          potentialName.toLowerCase().includes("日本語");

        // 優先順位に基づいて日本語名を設定
        if (hasKana) {
          japaneseName = potentialName;
          console.log(
            `Found Japanese name with kana from version page title: ${japaneseName}`
          );
        } else if (containsJapanKeyword) {
          // 「Japanese edition」などの英語表記のみの場合は、後でバージョン情報から日本語名を探す
          console.log(`Found version with Japan keyword: ${potentialName}`);
          // 一時的に保存しておく
          japaneseName = potentialName;
        } else if (hasKanjiOnly) {
          japaneseName = potentialName;
          console.log(
            `Found Japanese name with kanji only from version page title: ${japaneseName}`
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

    // ゲームタイプを確認（基本ゲームか拡張ゲームか）
    const gameType = item["@_type"] || "boardgame";
    const isExpansion = gameType === "boardgameexpansion";
    console.log("Game type:", gameType, "Is expansion:", isExpansion);

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
    // まずはひらがな・カタカナを含む名前を優先的に探す
    const japaneseNameWithKana = names.find((n: any) =>
      n["@_value"].match(/[\u3040-\u309F\u30A0-\u30FF]/)
    )?.["@_value"];

    // ひらがな・カタカナを含む名前がなければ、漢字のみの名前を探す
    const japaneseNameWithKanjiOnly = names.find(
      (n: any) =>
        !n["@_value"].match(/[\u3040-\u309F\u30A0-\u30FF]/) &&
        n["@_value"].match(/[\u4E00-\u9FAF]/)
    )?.["@_value"];

    console.log("日本語名検出ロジック:", {
      allNames: names.map((n: any) => ({
        type: n["@_type"],
        value: n["@_value"],
      })),
      japaneseNameWithKana,
      japaneseNameWithKanjiOnly,
    });

    // ひらがな・カタカナを含む名前を優先、なければ漢字のみの名前を使用
    const japaneseName = japaneseNameWithKana || japaneseNameWithKanjiOnly;

    // 「Japanese edition」などの英語表記を除外するための関数
    const isActualJapaneseName = (name: string | undefined): boolean => {
      if (!name) return false;

      // 実際に日本語文字（ひらがな、カタカナ、漢字）を含むか確認
      const containsJapaneseChars = !!name.match(
        /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
      );

      // ひらがな・カタカナを含むか確認
      const containsKana = !!name.match(/[\u3040-\u309F\u30A0-\u30FF]/);

      // 漢字のみを含むか確認
      const containsKanjiOnly =
        !!name.match(/[\u4E00-\u9FAF]/) && !containsKana;

      // 「Japanese」「Japan」などの英語表記のみの場合は除外
      const isOnlyEnglishJapaneseReference =
        !containsJapaneseChars &&
        (name.toLowerCase().includes("japanese") ||
          name.toLowerCase().includes("japan edition") ||
          name.toLowerCase().includes("japan version"));

      console.log(`Name "${name}" analysis:`, {
        containsJapaneseChars,
        containsKana,
        containsKanjiOnly,
        isOnlyEnglishJapaneseReference,
      });

      return containsJapaneseChars && !isOnlyEnglishJapaneseReference;
    };

    console.log(
      "All names:",
      names.map((n: any) => ({ type: n["@_type"], value: n["@_value"] }))
    );
    console.log("Japanese name with kana:", japaneseNameWithKana);
    console.log("Japanese name with kanji only:", japaneseNameWithKanjiOnly);
    console.log("Selected Japanese name:", japaneseName);
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

    // 日本語版情報を取得
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
        let highestPriority = 0;

        for (const version of versions) {
          const versionName = version.name?.["@_value"] || "";

          // 日本語版かどうかを判定
          // ひらがなまたはカタカナを含むか確認（最優先）
          const hasKana = !!versionName.match(/[\u3040-\u309F\u30A0-\u30FF]/);

          // 漢字のみを含むか確認
          const hasKanjiOnly =
            !hasKana && !!versionName.match(/[\u4E00-\u9FAF]/);

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
                  publisherName.includes("Ten Days Games") ||
                  publisherName.includes("Kenbill") ||
                  publisherName.includes("Japon Brand") ||
                  publisherName.includes("Yellow Submarine") ||
                  publisherName.includes("Capcom") ||
                  publisherName.includes("Bandai") ||
                  publisherName.includes("Konami") ||
                  publisherName.includes("Sega") ||
                  publisherName.includes("Nintendo") ||
                  publisherName.includes("Square Enix") ||
                  publisherName.includes("Taito") ||
                  publisherName.includes("Namco")
                ) {
                  hasJapanesePublisher = true;
                  break;
                }
              }
            }
          }

          // 日本語版と判定する条件と優先順位
          // 1. ひらがな・カタカナを含む場合は最優先
          // 2. 「Japanese」などのキーワードと日本の出版社の組み合わせ
          // 3. 「Japanese」などのキーワードを含むが、日本語の出版社がないもの
          // 4. 漢字のみの場合は最後
          let priority = 0;
          let isJapaneseVersion = false;

          if (hasKana) {
            isJapaneseVersion = true;
            priority = 4; // 最高優先度
          } else if (containsJapanKeyword && hasJapanesePublisher) {
            isJapaneseVersion = true;
            priority = 3;
          } else if (containsJapanKeyword) {
            isJapaneseVersion = true;
            priority = 2;
          } else if (hasKanjiOnly) {
            isJapaneseVersion = true;
            priority = 1;
          }

          if (isJapaneseVersion && priority > highestPriority) {
            console.log(
              `Found Japanese version: ${versionName} (Priority: ${priority})`
            );
            console.log("Version has kana:", hasKana);
            console.log("Version has Japan keyword:", containsJapanKeyword);
            console.log(
              "Version has Japanese publisher:",
              hasJapanesePublisher
            );
            console.log("Version has kanji only:", hasKanjiOnly);
            japaneseVersion = version;
            versionId = version["@_id"];
            highestPriority = priority;

            // ひらがな・カタカナを含む場合は即座に採用して検索終了
            if (hasKana) break;
          }
        }

        // 日本語版が見つかった場合
        if (japaneseVersion) {
          try {
            console.log("Found Japanese version:", japaneseVersion);

            // バージョン情報から日本語名を取得
            let versionJapaneseName = japaneseVersion.name?.["@_value"];

            // nameidから日本語名を取得（BGGのバージョンページでは「Name」フィールドに相当）
            if (
              japaneseVersion.nameid &&
              Array.isArray(japaneseVersion.nameid)
            ) {
              const primaryNameId = japaneseVersion.nameid.find(
                (n: any) => n["@_type"] === "primary"
              );
              if (
                primaryNameId &&
                primaryNameId["#text"] &&
                primaryNameId["#text"].match(
                  /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
                )
              ) {
                versionJapaneseName = primaryNameId["#text"];
                console.log(
                  "Found Japanese name from nameid:",
                  versionJapaneseName
                );
              }
            }

            // 出版社情報を取得
            let japanesePublisher = null;
            if (japaneseVersion.link) {
              const publisherLinks = Array.isArray(japaneseVersion.link)
                ? japaneseVersion.link.filter(
                    (l: any) => l["@_type"] === "boardgamepublisher"
                  )
                : japaneseVersion.link["@_type"] === "boardgamepublisher"
                ? [japaneseVersion.link]
                : [];

              for (const link of publisherLinks) {
                const publisherName = link["@_value"];
                if (
                  publisherName.match(
                    /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
                  ) ||
                  publisherName.includes("Hobby Japan") ||
                  publisherName.includes("Arclight") ||
                  publisherName.includes("Ten Days Games") ||
                  publisherName.includes("Kenbill") ||
                  publisherName.includes("Japon Brand") ||
                  publisherName.includes("Yellow Submarine") ||
                  publisherName.includes("Capcom") ||
                  publisherName.includes("Bandai") ||
                  publisherName.includes("Konami") ||
                  publisherName.includes("Sega") ||
                  publisherName.includes("Nintendo") ||
                  publisherName.includes("Square Enix") ||
                  publisherName.includes("Taito") ||
                  publisherName.includes("Namco")
                ) {
                  japanesePublisher = publisherName;
                  console.log("Found Japanese publisher:", japanesePublisher);
                  break;
                }
              }
            }

            // 発売日を取得
            let japaneseReleaseDate = null;
            if (japaneseVersion.yearpublished) {
              const year =
                japaneseVersion.yearpublished["@_value"] ||
                japaneseVersion.yearpublished;
              if (year) {
                japaneseReleaseDate = `${year}-01-01`;
                console.log(
                  "Found Japanese release date:",
                  japaneseReleaseDate
                );
              }
            }

            // 画像URLを取得
            let japaneseImageUrl = null;
            if (japaneseVersion.image) {
              japaneseImageUrl = japaneseVersion.image;
              console.log("Found Japanese image URL:", japaneseImageUrl);
            } else if (versionId) {
              // バージョンIDがある場合は、バージョン詳細ページから画像URLを取得
              try {
                const versionDetails = await getVersionDetails(versionId);
                if (versionDetails?.imageUrl) {
                  japaneseImageUrl = versionDetails.imageUrl;
                  console.log(
                    "Found Japanese image URL from version details:",
                    japaneseImageUrl
                  );
                }
              } catch (error) {
                console.error(
                  "Error getting version details for image URL:",
                  error
                );
              }
            }

            japaneseVersionInfo = {
              name: versionJapaneseName,
              publisher: japanesePublisher,
              releaseDate: japaneseReleaseDate,
              imageUrl: japaneseImageUrl,
            };

            console.log("Japanese version info:", japaneseVersionInfo);
          } catch (error) {
            console.error("Error processing Japanese version:", error);
          }
        }
      } catch (error) {
        console.error("Error checking for Japanese version:", error);
      }
    }

    // 拡張ゲームの場合は親ゲーム（基本ゲーム）の情報を取得
    let baseGameInfo = null;
    if (isExpansion) {
      try {
        console.log("Getting base game info for expansion");

        // 親ゲームのリンクを探す
        const baseGameLinks = item.link?.filter(
          (link: any) =>
            link["@_type"] === "boardgameexpansion" &&
            link["@_inbound"] === "true"
        );

        if (baseGameLinks && baseGameLinks.length > 0) {
          const baseGameId = baseGameLinks[0]["@_id"];
          const baseGameName = baseGameLinks[0]["@_value"];

          console.log(`Found base game: ${baseGameName} (ID: ${baseGameId})`);

          baseGameInfo = {
            id: baseGameId,
            name: baseGameName,
          };
        }
      } catch (error) {
        console.error("Error getting base game info:", error);
      }
    }

    // 日本語版の画像が見つからなかった場合は、代替名から日本語名を取得して画像を検索
    if (!japaneseImage && japaneseName) {
      try {
        console.log(
          "Japanese image not found from version info, searching with alternate name:",
          japaneseName
        );
        const japaneseImageUrl = await searchJapaneseVersionImage(japaneseName);
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

    // 最終的なゲーム情報を構築
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
      mechanics: (item.link || [])
        .filter((link: any) => link["@_type"] === "boardgamemechanic")
        .map((link: any) => link["@_value"]),
      categories: (item.link || [])
        .filter((link: any) => link["@_type"] === "boardgamecategory")
        .map((link: any) => link["@_value"]),
      weight: weight,
      bestPlayers,
      recommendedPlayers,
      publisher: publishers.length > 0 ? publishers[0] : undefined,
      designer: designers.length > 0 ? designers[0] : undefined,
      releaseDate,
      japanesePublisher: finalJapanesePublisher,
      japaneseReleaseDate: japaneseReleaseDate,
      japaneseName: finalJapaneseName,
      expansions: expansions.length > 0 ? expansions : undefined,
      isExpansion: isExpansion,
      baseGame: baseGameInfo,
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
        isExpansion: false,
        baseGame: undefined,
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
    if (process.env.NODE_ENV === "development") {
      console.log("Fetching game details for IDs:", ids);
    }
    const { data: xml } = await axios.get(
      `${BGG_API_BASE}/thing?id=${ids}&stats=1`
    );
    if (process.env.NODE_ENV === "development") {
      console.log("Game details XML:", xml);
    }
    const result = parser.parse(xml);
    if (process.env.NODE_ENV === "development") {
      console.log("Parsed game details:", result);
    }

    if (!result.items?.item) {
      if (process.env.NODE_ENV === "development") {
        console.log("No items found in game details");
      }
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

/**
 * BGGのランキング上位のゲームを取得する
 * @param limit 取得するゲーム数
 * @returns 上位ゲームのリスト
 */
export async function getTopRankedGames(limit: number = 100): Promise<any[]> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`Fetching top ${limit} ranked games from BGG`);
    }

    // 提供されたJSONデータを解析 (BGG Top 100)
    const topGamesList = [
      "224517", // 1 - Brass: Birmingham
      "161936", // 2 - Pandemic Legacy: Season 1
      "342942", // 3 - Ark Nova
      "174430", // 4 - Gloomhaven
      "233078", // 5 - Twilight Imperium: Fourth Edition
      "316554", // 6 - Dune: Imperium
      "167791", // 7 - Terraforming Mars
      "115746", // 8 - War of the Ring: Second Edition
      "187645", // 9 - Star Wars: Rebellion
      "162886", // 10 - Spirit Island
      "291457", // 11 - Gloomhaven: Jaws of the Lion
      "220308", // 12 - Gaia Project
      "397598", // 13 - Dune: Imperium – Uprising
      "12333", // 14 - Twilight Struggle
      "182028", // 15 - Through the Ages: A New Story of Civilization
      "84876", // 16 - The Castles of Burgundy
      "193738", // 17 - Great Western Trail
      "169786", // 18 - Scythe
      "266192", // 19 - Wingspan
      "180263", // 20 - Viticulture Essential Edition
      "276025", // 21 - Sleeping Gods
      "167355", // 22 - Nemesis
      "170216", // 23 - Blood Rage
      "192921", // 24 - Everdell
      "183394", // 25 - Concordia Venus
      "221107", // 26 - Pandemic Legacy: Season 2
      "164153", // 27 - Star Wars: Imperial Assault
      "171623", // 28 - The Gallerist
      "295486", // 29 - Trajan
      "177736", // 30 - A Feast for Odin
      "199478", // 31 - Pax Pamir: Second Edition
      "233867", // 32 - Clank! In! Space!
      "124361", // 33 - Concordia
      "3076", // 34 - Puerto Rico
      "169427", // 35 - Crokinole
      "251247", // 36 - Anachrony
      "288169", // 37 - Forgotten Waters
      "72125", // 38 - Eclipse: Second Dawn for the Galaxy
      "205059", // 39 - Mansions of Madness: Second Edition
      "209010", // 40 - Mechs vs. Minions
      "312484", // 41 - Lost Ruins of Arnak
      "42", // 42 - Tigris & Euphrates
      "120677", // 43 - Terra Mystica
      "173346", // 44 - 7 Wonders Duel
      "184267", // 45 - On Mars
      "175914", // 46 - Food Chain Magnate
      "285967", // 47 - Paladins of the West Kingdom
      "126163", // 48 - Pandemic: Iberia
      "31260", // 49 - Agricola
      "172818", // 50 - Grand Austria Hotel
      "284083", // 51 - The Crew: Mission Deep Sea
      "290236", // 52 - Marvel Champions: The Card Game
      "102680", // 53 - Dungeon Petz
      "317985", // 54 - Beyond the Sun
      "300531", // 55 - Imperium: Classics
      "281549", // 56 - Dinosaur Island
      "28143", // 57 - Race for the Galaxy
      "18602", // 58 - Caylus
      "2955", // 59 - Fury of Dracula
      "176920", // 60 - Roll for the Galaxy
      "42270", // 61 - Robinson Crusoe: Adventures on the Cursed Island
      "40834", // 62 - Agricola (Revised Edition 2016)
      "247763", // 63 - Underwater Cities
      "28720", // 64 - Brass: Lancashire
      "256960", // 65 - Orleans
      "183840", // 66 - Gaia Project
      "143519", // 67 - Tzolk'in: The Mayan Calendar
      "221965", // 68 - John Company: Second Edition
      "73439", // 69 - Troyes
      "227935", // 70 - Architects of the West Kingdom
      "237182", // 71 - Root
      "320", // 72 - Dune
      "25613", // 73 - Through the Ages: A Story of Civilization
      "301929", // 74 - Paladins of the West Kingdom
      "140934", // 75 - Twilight Imperium: Third Edition
      "295770", // 76 - Aeon's End: The New Age
      "255984", // 77 - Hallertau
      "246900", // 78 - Wingspan
      "205637", // 79 - Orleans
      "244992", // 80 - Barrage
      "284083", // 81 - The Crew: The Quest for Planet Nine
      "55690", // 82 - Kingdom Death: Monster
      "28143", // 83 - Race for the Galaxy
      "230802", // 84 - Azul
      "157354", // 85 - Five Tribes: The Djinns of Naqala
      "201808", // 86 - Clank!: A Deck-Building Adventure
      "72125", // 87 - Eclipse: New Dawn for the Galaxy
      "159675", // 88 - Fields of Arle
      "191189", // 89 - Aeon's End
      "371942", // 90 - The White Castle
      "332772", // 91 - Revive
      "110327", // 92 - Lords of Waterdeep
      "322289", // 93 - Darwin's Journey
      "93", // 94 - El Grande
      "414317", // 95 - Harmonies
      "229853", // 96 - Teotihuacan: City of Gods
      "390092", // 97 - Ticket to Ride Legacy: Legends of the West
      "317985", // 98 - Beyond the Sun
      "25613", // 99 - Through the Ages: A Story of Civilization
      "291453", // 100 - SCOUT
    ];

    // 重複を除外
    let uniqueIds = new Set(topGamesList);

    // limit数までに制限
    const gameIds = Array.from(uniqueIds).slice(0, limit);
    if (process.env.NODE_ENV === "development") {
      console.log(`Using ${gameIds.length} unique game IDs from the list`);
    }

    // ゲームを分割して25個ずつ詳細情報を取得
    const batchSize = 25;
    const games: BGGGameDetails[] = [];

    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batchIds = gameIds.slice(i, i + batchSize);
      if (process.env.NODE_ENV === "development") {
        console.log(
          `Fetching details for games ${i + 1} to ${i + batchIds.length}`
        );
      }

      const batchGames = await getGamesDetails(batchIds.join(","));
      games.push(...batchGames);

      // BGG APIの負荷を減らすために少し待機
      if (i + batchSize < gameIds.length) {
        if (process.env.NODE_ENV === "development") {
          console.log("Waiting 1 second before next batch...");
        }
        await sleep(1000);
      }
    }

    // 取得したゲーム情報をランク順に並べ替え
    const sortedGames = games.sort((a, b) => {
      const rankA = gameIds.indexOf(a.id);
      const rankB = gameIds.indexOf(b.id);
      return rankA - rankB;
    });

    return sortedGames.slice(0, limit);
  } catch (error) {
    console.error("Error fetching top ranked games:", error);
    return [];
  }
}
