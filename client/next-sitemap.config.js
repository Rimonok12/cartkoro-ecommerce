/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.cartkoro.com',
  generateRobotsTxt: true, // generates robots.txt automatically
  sitemapSize: 5000,
  exclude: ['/cart', '/checkout', '/login', '/register', '/api/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/cart', '/checkout', '/login', '/register', '/api/'],
      },
    ],
    additionalSitemaps: [
      'https://www.cartkoro.com/sitemap.xml',
      'https://www.cartkoro.com/server-sitemap.xml',
    ],
  },
};
