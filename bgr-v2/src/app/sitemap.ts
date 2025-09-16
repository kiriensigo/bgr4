import { MetadataRoute } from 'next'

const BASE_URL = process.env['NEXT_PUBLIC_APP_URL'] || 'https://bgrq.netlify.app'

export default function sitemap(): MetadataRoute.Sitemap {
  try {
    // Static sitemap for production build
    // Dynamic generation will be handled at runtime via API routes

    // 静的ページ
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${BASE_URL}/games`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/reviews`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/search`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      },
      {
        url: `${BASE_URL}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      },
      {
        url: `${BASE_URL}/register`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      }
    ]

    return staticPages

  } catch (error) {
    console.error('Sitemap generation error:', error)
    
    // フォールバック: 基本的なサイトマップ
    return [
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${BASE_URL}/games`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/reviews`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/search`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }
    ]
  }
}