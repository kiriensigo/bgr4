interface Game {
  id: number
  name: string
  description?: string
  year_published?: number
  min_players?: number
  max_players?: number
  playing_time?: number
  image_url?: string
  rating_average?: number
  rating_count?: number
  mechanics?: string[]
  categories?: string[]
  designers?: string[]
  publishers?: string[]
}

interface Review {
  id: number
  title: string
  content: string
  rating: number
  created_at: string
  updated_at: string
  user: {
    username: string
    full_name?: string
  }
  game: {
    name: string
  }
}

interface GameStructuredDataProps {
  game: Game
}

interface ReviewStructuredDataProps {
  review: Review
}

interface WebsiteStructuredDataProps {
  url?: string
}

export function GameStructuredData({ game }: GameStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: game.name,
    description: game.description,
    image: game.image_url,
    url: `https://bgrq.netlify.app/games/${game.id}`,
    brand: {
      '@type': 'Brand',
      name: game.publishers?.[0] || 'Unknown Publisher'
    },
    category: 'Board Game',
    offers: {
      '@type': 'AggregateOffer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'JPY'
    },
    additionalProperty: [
      ...(game.min_players && game.max_players ? [{
        '@type': 'PropertyValue',
        name: 'Players',
        value: game.min_players === game.max_players 
          ? `${game.min_players}人`
          : `${game.min_players}-${game.max_players}人`
      }] : []),
      ...(game.playing_time ? [{
        '@type': 'PropertyValue',
        name: 'Playing Time',
        value: `${game.playing_time}分`
      }] : []),
      ...(game.year_published ? [{
        '@type': 'PropertyValue',
        name: 'Year Published',
        value: game.year_published
      }] : []),
      ...(game.designers?.length ? [{
        '@type': 'PropertyValue',
        name: 'Designers',
        value: game.designers.join(', ')
      }] : [])
    ],
    ...(game.rating_average && game.rating_count ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: game.rating_average,
        reviewCount: game.rating_count,
        bestRating: 10,
        worstRating: 1
      }
    } : {})
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  )
}

export function ReviewStructuredData({ review }: ReviewStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: review.title,
    reviewBody: review.content,
    datePublished: review.created_at,
    dateModified: review.updated_at,
    author: {
      '@type': 'Person',
      name: review.user.full_name || review.user.username
    },
    itemReviewed: {
      '@type': 'Product',
      name: review.game.name,
      category: 'Board Game'
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 10,
      worstRating: 1
    },
    url: `https://bgrq.netlify.app/reviews/${review.id}`
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  )
}

export function WebsiteStructuredData({ url = 'https://bgrq.netlify.app' }: WebsiteStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BGR - Board Game Review',
    alternateName: 'BGR',
    url: url,
    description: 'ボードゲームのレビューと情報を共有するコミュニティサイト',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'BGR Team',
      url: url,
      logo: {
        '@type': 'ImageObject',
        url: `${url}/images/logo.png`,
        width: 112,
        height: 112
      }
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  )
}

export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BGR - Board Game Review',
    url: 'https://bgrq.netlify.app',
    logo: 'https://bgrq.netlify.app/images/logo.png',
    description: 'ボードゲームのレビューと情報を共有するコミュニティサイト',
    foundingDate: '2024',
    sameAs: [
      'https://twitter.com/BGR_BoardGame',
      'https://github.com/bgr-team'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'Japanese'
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  )
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  )
}