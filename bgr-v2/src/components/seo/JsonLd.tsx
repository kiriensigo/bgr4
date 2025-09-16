import Script from 'next/script'

interface JsonLdProps {
  data: object
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
      }}
    />
  )
}

export function WebsiteJsonLd() {
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BGR - Board Game Review',
    alternateName: 'ボードゲームレビュー',
    description: 'ボードゲームのレビューと情報を共有するコミュニティサイト',
    url: process.env['NEXT_PUBLIC_APP_URL'] || 'https://bgrq.netlify.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${process.env['NEXT_PUBLIC_APP_URL'] || 'https://bgrq.netlify.app'}/search?query={search_term_string}`,
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'BGR Team',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env['NEXT_PUBLIC_APP_URL'] || 'https://bgrq.netlify.app'}/logo.png`
      }
    },
    sameAs: [],
    inLanguage: 'ja'
  }

  return <JsonLd data={websiteData} />
}

// ゲーム用構造化データ
export function GameJsonLd({ game }: { game: any }) {
  const gameData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: game.japanese_name || game.name,
    alternateName: game.name !== game.japanese_name ? game.name : undefined,
    description: game.description || `${game.name}のボードゲーム情報とレビュー`,
    image: game.image_url,
    brand: {
      '@type': 'Brand',
      name: game.publishers?.[0] || 'Unknown Publisher'
    },
    manufacturer: game.publishers?.map((publisher: string) => ({
      '@type': 'Organization',
      name: publisher
    })),
    category: 'Board Game',
    productID: game.bgg_id?.toString(),
    aggregateRating: game.rating_average && game.rating_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: game.rating_average,
      reviewCount: game.rating_count,
      bestRating: 10,
      worstRating: 1
    } : undefined,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'JPY'
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: '対象年齢',
        value: game.min_age ? `${game.min_age}歳以上` : undefined
      },
      {
        '@type': 'PropertyValue', 
        name: 'プレイ人数',
        value: game.min_players && game.max_players 
          ? `${game.min_players}-${game.max_players}人`
          : undefined
      },
      {
        '@type': 'PropertyValue',
        name: 'プレイ時間',
        value: game.playing_time ? `約${game.playing_time}分` : undefined
      },
      {
        '@type': 'PropertyValue',
        name: '発売年',
        value: game.year_published?.toString()
      }
    ].filter(prop => prop.value)
  }

  return <JsonLd data={gameData} />
}

// レビュー用構造化データ
export function ReviewJsonLd({ review }: { review: any }) {
  const reviewData = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewBody: review.content,
    name: review.title,
    author: {
      '@type': 'Person',
      name: review.user?.full_name || review.user?.username || '匿名ユーザー'
    },
    datePublished: review.created_at,
    dateModified: review.updated_at,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.overall_score || review.rating,
      bestRating: 10,
      worstRating: 1
    },
    itemReviewed: {
      '@type': 'Product',
      name: review.game?.japanese_name || review.game?.name,
      image: review.game?.image_url,
      category: 'Board Game'
    },
    publisher: {
      '@type': 'Organization',
      name: 'BGR - Board Game Review',
      url: process.env['NEXT_PUBLIC_APP_URL'] || 'https://bgrq.netlify.app'
    },
    inLanguage: 'ja'
  }

  return <JsonLd data={reviewData} />
}

// パンくずリスト用構造化データ
export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return <JsonLd data={breadcrumbData} />
}

// 組織情報用構造化データ
export function OrganizationJsonLd() {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BGR - Board Game Review',
    url: process.env['NEXT_PUBLIC_APP_URL'] || 'https://bgrq.netlify.app',
    logo: `${process.env['NEXT_PUBLIC_APP_URL'] || 'https://bgrq.netlify.app'}/logo.png`,
    description: 'ボードゲームのレビューと情報を共有するコミュニティサイト',
    foundingDate: '2024',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@bgr.com'
    }
  }

  return <JsonLd data={organizationData} />
}