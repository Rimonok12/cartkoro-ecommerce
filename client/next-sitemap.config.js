/** @type {import('next-sitemap').IConfig} */
const nextSitemapConfig = {
  siteUrl: 'https://www.cartkoro.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  outDir: './public',
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/admin/*', '/api/*', '/cart', '/login', '/register'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/cart', '/api'] },
    ],
    additionalSitemaps: [
      'https://www.cartkoro.com/server-sitemap.xml',
      'https://www.cartkoro.com/sitemap-static.xml',
    ],
  },
};

module.exports = nextSitemapConfig; // ✅ <-- Use this
