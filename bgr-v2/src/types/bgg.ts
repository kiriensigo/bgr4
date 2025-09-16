// BGG APIレスポンス型定義
export interface BGGSearchResponse {
  items: {
    item: BGGSearchItem[]
  }
}

export interface BGGSearchItem {
  $: {
    id: string
    type: string
  }
  name: {
    $: {
      value: string
    }
  }[]
  yearpublished?: {
    $: {
      value: string
    }
  }[]
}

export interface BGGGameResponse {
  items: {
    item: BGGGameItem[]
  }
}

export interface BGGGameItem {
  $: {
    id: string
    type: string
  }
  thumbnail?: string[]
  image?: string[]
  name: {
    $: {
      type: string
      value: string
    }
  }[]
  description?: string[]
  yearpublished?: {
    $: {
      value: string
    }
  }[]
  minplayers?: {
    $: {
      value: string
    }
  }[]
  maxplayers?: {
    $: {
      value: string
    }
  }[]
  // Add explicit min/max playtime fields present in BGG XML
  minplaytime?: {
    $: {
      value: string
    }
  }[]
  maxplaytime?: {
    $: {
      value: string
    }
  }[]
  playingtime?: {
    $: {
      value: string
    }
  }[]
  minage?: {
    $: {
      value: string
    }
  }[]
  link: BGGLink[]
  statistics?: {
    ratings: {
      average: {
        $: {
          value: string
        }
      }[]
      usersrated: {
        $: {
          value: string
        }
      }[]
    }[]
  }[]
}

export interface BGGLink {
  $: {
    type: string
    id: string
    value: string
  }
}

export interface BGGHotResponse {
  items: {
    item: BGGHotItem[]
  }
}

export interface BGGHotItem {
  $: {
    id: string
    rank: string
  }
  thumbnail: {
    $: {
      value: string
    }
  }[]
  name: {
    $: {
      value: string
    }
  }[]
  yearpublished?: {
    $: {
      value: string
    }
  }[]
}

// 正規化された型定義
export interface BGGSearchResult {
  id: number
  name: string
  yearPublished?: number
  rank?: number
}

export interface BGGGameDetail {
  id: number
  name: string
  description?: string
  yearPublished?: number
  minPlayers?: number
  maxPlayers?: number
  playingTime?: number
  minPlayingTime?: number
  maxPlayingTime?: number
  minAge?: number
  imageUrl?: string
  thumbnailUrl?: string
  mechanics: string[]
  categories: string[]
  designers: string[]
  publishers: string[]
  averageRating?: number
  ratingCount?: number
}

// エラー型定義
export class BGGApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public bggResponse?: string
  ) {
    super(message)
    this.name = 'BGGApiError'
  }
}
