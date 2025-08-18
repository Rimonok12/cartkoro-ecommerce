// Forwards /api/** to your backend (default http://localhost:8000)
// Keeps methods, cookies, status, and response body intact.

export default async function handler(req, res) {
  const { proxy = [], ...restQs } = req.query;
  const path = Array.isArray(proxy) ? proxy.join("/") : proxy;
  const qs = new URLSearchParams(restQs).toString();
  const base = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:8000";
  const url = `${base}/${path}${qs ? `?${qs}` : ""}`;

  // Build headers; forward cookies
  const headers = {
    // forward JSON by default
    "Content-Type": "application/json",
    // include original cookies for auth
    ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}),
  };

  // Prepare body for non-GET/HEAD
  let body;
  if (!["GET", "HEAD"].includes(req.method)) {
    // Next already parsed JSON; stringify back
    body =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  }

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    // Forward Set-Cookie from upstream (undici supports getSetCookie())
    const setCookies =
      upstream.headers.getSetCookie?.() ||
      upstream.headers.raw?.()["set-cookie"] ||
      [];
    if (setCookies.length) res.setHeader("Set-Cookie", setCookies);

    // Pass through status + body + content type
    const contentType =
      upstream.headers.get("content-type") || "application/json";
    const text = await upstream.text();
    res
      .status(upstream.status)
      .setHeader("Content-Type", contentType)
      .send(text);
  } catch (e) {
    console.error("Proxy error:", e);
    res.status(502).json({ error: "Bad gateway" });
  }
}
