/** @type {import('next-sitemap').IConfig} */
const nextSitemapConfig = {
  siteUrl: 'https://www.cartkoro.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: [
    '/cart',
    '/login',
    '/register',
    '/api/*',
    '/admin',
    '/admin/*',
    '/seller',
    '/seller/*',
    '/useLaterFile/*',
    '/order-details',
    '/my-orders',
    '/account/*',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/cart',
          '/login',
          '/register',
          '/api/',
          '/admin',
          '/admin/*',
          '/seller',
          '/seller/*',
          '/useLaterFile/*',
          '/order-details',
          '/my-orders',
          '/account/*',
        ],
      },
    ],
    additionalSitemaps: [
      'https://www.cartkoro.com/sitemap.xml',
      'https://www.cartkoro.com/server-sitemap.xml',
    ],
  },
};

export default nextSitemapConfig;
