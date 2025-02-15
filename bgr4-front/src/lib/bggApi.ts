import { XMLParser } from 'fast-xml-parser'
import axios from 'axios'

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2'
const parser = new XMLParser({ 
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
})

export type BGGGame = {
  id: string
  name: string
  description: string
  image: string
  thumbnail: string
  minPlayers: number
  maxPlayers: number
  playingTime: number
  minPlayTime: number
  maxPlayTime: number
  yearPublished: number
  averageRating: number
  rank: number
  mechanics: string[]
  categories: string[]
  designers: string[]
  publishers: string[]
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data } = await axios.get(url);
      if (typeof data === 'string' && data.includes('Please try again later')) {
        await sleep(2000); // Wait 2 seconds before retry
        continue;
      }
      return data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(2000);
    }
  }
  throw new Error('Max retries reached');
}

export async function getHotGames(): Promise<BGGGame[]> {
  try {
    console.log('Fetching hot games...');
    const xml = await fetchWithRetry(`${BGG_API_BASE}/hot?type=boardgame`);
    console.log('Hot games XML:', xml);
    const result = parser.parse(xml);
    console.log('Parsed hot games:', result);
    
    if (!result.items?.item) {
      console.log('No items found in hot games');
      return [];
    }

    const hotItems = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
    const gameIds = hotItems.slice(0, 20).map((item: any) => item['@_id']).join(',');
    console.log('Game IDs:', gameIds);
    
    const games = await getGamesDetails(gameIds);
    console.log('Retrieved games:', games);
    return games;
  } catch (error) {
    console.error('Error fetching hot games:', error);
    return [];
  }
}

export async function getGameDetails(id: string): Promise<BGGGame> {
  try {
    const games = await getGamesDetails(id)
    return games[0]
  } catch (error) {
    console.error(`Error fetching game ${id}:`, error)
    throw error
  }
}

async function getGamesDetails(ids: string): Promise<BGGGame[]> {
  try {
    console.log('Fetching game details for IDs:', ids);
    const { data: xml } = await axios.get(`${BGG_API_BASE}/thing?id=${ids}&stats=1`);
    console.log('Game details XML:', xml);
    const result = parser.parse(xml);
    console.log('Parsed game details:', result);
    
    if (!result.items?.item) {
      console.log('No items found in game details');
      return [];
    }

    const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
    
    return items.map((item: any) => {
      try {
        return {
          id: item['@_id'],
          name: Array.isArray(item.name) 
            ? item.name.find((n: any) => n['@_type'] === 'primary')['@_value']
            : item.name['@_value'],
          description: item.description?.replace(/&#10;/g, '\n') || '',
          image: item.image || '',
          thumbnail: item.thumbnail || '',
          minPlayers: parseInt(item.minplayers?.['@_value']) || 0,
          maxPlayers: parseInt(item.maxplayers?.['@_value']) || 0,
          playingTime: parseInt(item.playingtime?.['@_value']) || 0,
          minPlayTime: parseInt(item.minplaytime?.['@_value']) || 0,
          maxPlayTime: parseInt(item.maxplaytime?.['@_value']) || 0,
          yearPublished: parseInt(item.yearpublished?.['@_value']) || 0,
          averageRating: parseFloat(item.statistics?.ratings?.average?.['@_value']) || 0,
          rank: parseInt(item.statistics?.ratings?.ranks?.rank?.[0]?.['@_value']) || 0,
          mechanics: (item.link || [])
            .filter((link: any) => link['@_type'] === 'boardgamemechanic')
            .map((link: any) => link['@_value']),
          categories: (item.link || [])
            .filter((link: any) => link['@_type'] === 'boardgamecategory')
            .map((link: any) => link['@_value']),
          designers: (item.link || [])
            .filter((link: any) => link['@_type'] === 'boardgamedesigner')
            .map((link: any) => link['@_value']),
          publishers: (item.link || [])
            .filter((link: any) => link['@_type'] === 'boardgamepublisher')
            .map((link: any) => link['@_value']),
        };
      } catch (error) {
        console.error('Error parsing game item:', error, item);
        return null;
      }
    }).filter((game): game is BGGGame => game !== null);
  } catch (error) {
    console.error('Error fetching game details:', error);
    return [];
  }
}

export async function fetchBGGData(endpoint: string): Promise<string> {
  const response = await fetch(`${BGG_API_BASE}/${endpoint}`)
  if (!response.ok) {
    throw new Error('BGG APIからのデータ取得に失敗しました')
  }
  return await response.text()
}

export function parseXMLResponse(xmlText: string): Document {
  const parser = new DOMParser()
  return parser.parseFromString(xmlText, 'text/xml')
} 