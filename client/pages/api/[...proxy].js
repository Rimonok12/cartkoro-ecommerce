// // Forwards /api/** to your backend (default http://localhost:8000)
// // Keeps methods, cookies, status, and response body intact.

// export default async function handler(req, res) {
//   const { proxy = [], ...restQs } = req.query;
//   const path = Array.isArray(proxy) ? proxy.join("/") : proxy;
//   const qs = new URLSearchParams(restQs).toString();
//   const base = process.env.NODE_HOST;
//   const url = `${base}/${path}${qs ? `?${qs}` : ""}`;

//   // Build headers; forward cookies
//   const headers = {
//     // forward JSON by default
//     "Content-Type": "application/json",
//     // include original cookies for auth
//     ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}),
//   };

//   // Prepare body for non-GET/HEAD
//   let body;
//   if (!["GET", "HEAD"].includes(req.method)) {
//     // Next already parsed JSON; stringify back
//     body =
//       typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
//   }

//   try {
//     const upstream = await fetch(url, {
//       method: req.method,
//       headers,
//       body,
//     });

//     // Forward Set-Cookie from upstream (undici supports getSetCookie())
//     const setCookies =
//       upstream.headers.getSetCookie?.() ||
//       upstream.headers.raw?.()["set-cookie"] ||
//       [];
//     if (setCookies.length) res.setHeader("Set-Cookie", setCookies);

//     // Pass through status + body + content type
//     const contentType =
//       upstream.headers.get("content-type") || "application/json";
//     const text = await upstream.text();
//     res
//       .status(upstream.status)
//       .setHeader("Content-Type", contentType)
//       .send(text);
//   } catch (e) {
//     console.error("Proxy error:", e);
//     res.status(502).json({ error: "Bad gateway" });
//   }
// }
export default async function handler(req, res) {
  const { proxy = [], ...restQs } = req.query;
  const path = Array.isArray(proxy) ? proxy.join("/") : proxy;
  const qs = new URLSearchParams(restQs).toString();

  // Always ensure upstream path has a single leading /api/ prefix
  const upstreamPath = path.startsWith("api/") ? `/${path}` : `/api/${path}`;

  const base = process.env.NODE_HOST?.replace(/\/+$/, "") || "";
  const url = `${base}${upstreamPath}${qs ? `?${qs}` : ""}`;

  const headers = {
    // forward common headers
    "Content-Type": req.headers["content-type"] || "application/json",
    cookie: req.headers.cookie || "",
    Authorization: req.headers.authorization || "",
    Accept: req.headers.accept || "*/*",
  };

  let body;
  if (!["GET", "HEAD"].includes(req.method)) {
    body =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  }

  try {
    const upstream = await fetch(url, { method: req.method, headers, body });

    // Forward Set-Cookie (supports undici + node-fetch)
    const setCookies =
      upstream.headers.getSetCookie?.() ||
      upstream.headers.raw?.()["set-cookie"] ||
      upstream.headers.get("set-cookie") ||
      [];
    if (setCookies?.length) res.setHeader("Set-Cookie", setCookies);

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
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
