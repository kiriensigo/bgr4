/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://bgrq.netlify.app',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: [
    '/admin/*',
    '/api/*',
    '/auth/*',
    '/404',
    '/500',
    '/offline'
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/']
      }
    ]
  }
}