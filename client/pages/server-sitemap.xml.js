// pages/server-sitemap.xml.js
export async function getServerSideProps({ res }) {
  const SITE = 'https://www.cartkoro.com';

  // 1) Fetch dynamic content (replace with your real data sources)
  async function fetchProducts() {
    try {
      // Expecting: [{ slug: 'product-slug', updatedAt: ISO, images: [url1,url2] }, ...]
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/product/sitemap-list`
      );
      if (!r.ok) throw new Error('product fetch failed');
      return await r.json();
    } catch (e) {
      console.error('Sitemap products error:', e);
      return [];
    }
  }

  async function fetchCategories() {
    try {
      // Expecting: [{ slug: 'mens-jackets', updatedAt: ISO }]
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/category/sitemap-list`
      );
      if (!r.ok) throw new Error('category fetch failed');
      return await r.json();
    } catch (e) {
      console.error('Sitemap categories error:', e);
      return [];
    }
  }

  const [products, categories] = await Promise.all([
    fetchProducts(),
    fetchCategories(),
  ]);

  // 2) Build XML
  const urls = [];

  // Categories (optional)
  for (const c of categories) {
    urls.push(`
  <url>
    <loc>${SITE}/category/${encodeURIComponent(c.slug)}</loc>
    ${
      c.updatedAt
        ? `<lastmod>${new Date(c.updatedAt).toISOString()}</lastmod>`
        : ''
    }
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  // Products with images
  for (const p of products) {
    const images =
      Array.isArray(p.images) && p.images.length
        ? p.images
            .slice(0, 10) // keep it lean
            .map(
              (img) => `
    <image:image>
      <image:loc>${img}</image:loc>
    </image:image>`
            )
            .join('')
        : '';

    urls.push(`
  <url>
    <loc>${SITE}/product/${encodeURIComponent(p.slug)}</loc>
    ${
      p.updatedAt
        ? `<lastmod>${new Date(p.updatedAt).toISOString()}</lastmod>`
        : ''
    }
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
    ${images}
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`.trim();

  // 3) Send
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400'); // cache at the edge
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function ServerSitemap() {
  return null; // SSR only
}
