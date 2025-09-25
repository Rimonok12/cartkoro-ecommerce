// pages/api/search/products.js

export default async function handler(req, res) {
  try {
    // Only allow GET requests
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    // Extract query params
    const { q, size, hitsPerPage } = req.query;

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (size) params.set("size", size);
    if (hitsPerPage) params.set("hitsPerPage", hitsPerPage);

    // Proxy to your Render backend
    const url = `${process.env.NODE_HOST}/api/product/searchProducts?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ message: "Proxy error", error: err.message });
  }
}
