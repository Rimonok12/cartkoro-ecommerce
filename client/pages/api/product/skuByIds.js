// pages/api/product/skuByIds.js
import { forwardCookies } from "@/lib/forwardCookies";

export default async function handler(req, res) {
  try {
    const idsParam = String(req.query.ids || "").trim();
    const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean);

    if (!ids.length) {
      return res.status(400).json({ message: "ids (CSV) is required" });
    }

    const base = (process.env.NODE_HOST || "").replace(/\/+$/, "");

    // Try several likely upstream paths (GET first, then POST).
    // Return the first that works; otherwise return [] gracefully.
    const candidates = [
      { method: "GET",  url: `${base}/api/productsku/getByIds?ids=${encodeURIComponent(ids.join(","))}` },
      { method: "GET",  url: `${base}/api/product/getSkuByIds?ids=${encodeURIComponent(ids.join(","))}` },
      { method: "POST", url: `${base}/api/productsku/bulk`,         body: JSON.stringify({ ids }) },
      { method: "POST", url: `${base}/api/product/sku/bulk`,        body: JSON.stringify({ ids }) },
    ];

    for (const c of candidates) {
      try {
        const upstream = await fetch(c.url, {
          method: c.method,
          headers: {
            "Content-Type": "application/json",
            cookie: req.headers.cookie || "",
            Authorization: req.headers.authorization || "",
          },
          body: c.body,
        });

        if (!upstream.ok) continue;

        forwardCookies?.(upstream, res);

        const text = await upstream.text();
        let data; try { data = JSON.parse(text); } catch { continue; }

        // Accept shapes: [], {data:[]}, {items:[]}
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : data?.items || [];

        if (Array.isArray(list)) {
          return res.status(200).json(list);
        }
      } catch {
        // try next candidate
      }
    }

    // If nothing worked, return empty array (so UI still renders)
    return res.status(200).json([]);
  } catch (err) {
    return res.status(500).json({ message: "Proxy error", error: err.message });
  }
}
