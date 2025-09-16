import xml2js from 'xml2js';

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
}

export interface BggGameSearchResult {
  id: number;
  name: string;
  yearPublished?: number;
}

export interface BggGameDetails {
  id: number;
  name: string;
  description?: string;
  yearPublished?: number;
  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
  minAge?: number;
  minPlayingTime?: number;
  maxPlayingTime?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  designers: string[];
  publishers: string[];
  mechanics: string[];
  categories: string[];
  weight?: number;
  rating?: number;
  averageRating?: number;
  bestPlayerCounts?: number[];
  recommendedPlayerCounts?: number[];
}

export async function searchBggGames(query: string): Promise<BggGameSearchResult[]> {
  await rateLimit();
  
  try {
    const response = await fetch(`${BGG_API_BASE}/search?query=${encodeURIComponent(query)}&type=boardgame`);
    
    if (!response.ok) {
      throw new Error(`BGG API error: ${response.status}`);
    }
    
    const xmlData = await response.text();
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    if (!result.items?.item) {
      return [];
    }
    
    const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
    
    return items.map((item: any) => ({
      id: parseInt(item.$.id),
      name: Array.isArray(item.name) ? item.name[0].$.value : item.name.$.value,
      yearPublished: item.yearpublished ? parseInt(item.yearpublished.$.value) : undefined
    }));
  } catch (error) {
    console.error('Error searching BGG games:', error);
    throw new Error('Failed to search BGG games');
  }
}

export async function getBggGameDetails(gameId: number): Promise<BggGameDetails> {
  await rateLimit();
  
  try {
    const response = await fetch(`${BGG_API_BASE}/thing?id=${gameId}&stats=1`);
    
    if (!response.ok) {
      throw new Error(`BGG API error: ${response.status}`);
    }
    
    const xmlData = await response.text();
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    if (!result.items?.item) {
      throw new Error('Game not found');
    }
    
    const item = Array.isArray(result.items.item) ? result.items.item[0] : result.items.item;
    
    // Extract names (prefer primary name)
    const names = Array.isArray(item.name) ? item.name : [item.name];
    const primaryName = names.find((n: any) => n.$.type === 'primary')?.$.value || names[0]?.$.value;
    
    // Extract designers
    const designers = item.link
      ?.filter((link: any) => link.$.type === 'boardgamedesigner')
      ?.map((link: any) => link.$.value) || [];
    
    // Extract publishers
    const publishers = item.link
      ?.filter((link: any) => link.$.type === 'boardgamepublisher')
      ?.map((link: any) => link.$.value) || [];
    
    // Extract mechanics (BGG原データをそのまま返す - 変換しない)
    const mechanics = item.link
      ?.filter((link: any) => link.$.type === 'boardgamemechanic')
      ?.map((link: any) => link.$.value) || [];
    
    // Extract categories (BGG原データをそのまま返す - 変換しない)
    const categories = item.link
      ?.filter((link: any) => link.$.type === 'boardgamecategory')
      ?.map((link: any) => link.$.value) || [];
    
    // Extract poll data for best player counts
    const polls = item.poll || [];
    const playerCountPoll = polls.find((poll: any) => poll.$.name === 'suggested_numplayers');
    
    let bestPlayerCounts: number[] = [];
    let recommendedPlayerCounts: number[] = [];
    
    if (playerCountPoll?.results) {
      const results = Array.isArray(playerCountPoll.results) ? playerCountPoll.results : [playerCountPoll.results];
      
      results.forEach((result: any) => {
        const numPlayers = result.$.numplayers;
        const playerCount = numPlayers === '10+' ? 10 : parseInt(numPlayers);
        
        if (isNaN(playerCount)) return;
        
        const votes = result.result || [];
        const bestVotes = votes.find((v: any) => v.$.value === 'Best')?.$.numvotes || 0;
        const recommendedVotes = votes.find((v: any) => v.$.value === 'Recommended')?.$.numvotes || 0;
        const notRecommendedVotes = votes.find((v: any) => v.$.value === 'Not Recommended')?.$.numvotes || 0;
        
        const totalVotes = parseInt(bestVotes) + parseInt(recommendedVotes) + parseInt(notRecommendedVotes);
        
        if (totalVotes > 0) {
          const bestRatio = parseInt(bestVotes) / totalVotes;
          const recommendedRatio = (parseInt(bestVotes) + parseInt(recommendedVotes)) / totalVotes;
          
          if (bestRatio >= 0.5) {
            bestPlayerCounts.push(playerCount);
          } else if (recommendedRatio >= 0.5) {
            recommendedPlayerCounts.push(playerCount);
          }
        }
      });
    }
    
    // APIルートで期待されるフィールド名に合わせる
    const cleanDescription = (desc: string) => {
      return desc
        .replace(/<[^>]*>/g, '') // HTMLタグ削除
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#10;/g, '\n')
        .trim()
    }
    
    return {
      id: parseInt(item.$.id),
      name: primaryName,
      description: item.description?.[0] ? cleanDescription(item.description[0]) : undefined,
      yearPublished: item.yearpublished?.[0]?.$.value ? parseInt(item.yearpublished[0].$.value) : undefined,
      minPlayers: parseInt(item.minplayers?.[0]?.$.value || '1'),
      maxPlayers: parseInt(item.maxplayers?.[0]?.$.value || '1'),
      playingTime: parseInt(item.playingtime?.[0]?.$.value || '0'),
      minAge: item.minage?.[0]?.$.value ? parseInt(item.minage[0].$.value) : undefined,
      imageUrl: item.image?.[0] || undefined,
      thumbnailUrl: item.thumbnail?.[0] || undefined,
      designers,
      publishers,
      mechanics, // BGG原データ（変換前）
      categories, // BGG原データ（変換前）
      averageRating: item.statistics?.[0]?.ratings?.[0]?.average?.[0]?.$.value 
        ? parseFloat(item.statistics[0].ratings[0].average[0].$.value) 
        : undefined,
      weight: item.statistics?.[0]?.ratings?.[0]?.averageweight?.[0]?.$.value 
        ? parseFloat(item.statistics[0].ratings[0].averageweight[0].$.value) 
        : undefined,
      rating: item.statistics?.[0]?.ratings?.[0]?.average?.[0]?.$.value 
        ? parseFloat(item.statistics[0].ratings[0].average[0].$.value) 
        : undefined,
      bestPlayerCounts,
      recommendedPlayerCounts
    };
  } catch (error) {
    console.error('Error fetching BGG game details:', error);
    throw new Error('Failed to fetch BGG game details');
  }
}

export async function getBggHotGames(limit: number = 50): Promise<BggGameSearchResult[]> {
  await rateLimit();
  
  try {
    const response = await fetch(`${BGG_API_BASE}/hot?type=boardgame`);
    
    if (!response.ok) {
      throw new Error(`BGG API error: ${response.status}`);
    }
    
    const xmlData = await response.text();
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    if (!result.items?.item) {
      return [];
    }
    
    const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
    
    return items.slice(0, limit).map((item: any) => ({
      id: parseInt(item.$.id),
      name: item.name?.[0]?.$.value || 'Unknown',
      yearPublished: item.yearpublished?.[0]?.$.value ? parseInt(item.yearpublished[0].$.value) : undefined
    }));
  } catch (error) {
    console.error('Error fetching BGG hot games:', error);
    throw new Error('Failed to fetch BGG hot games');
  }
}