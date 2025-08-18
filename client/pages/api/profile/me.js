// GET /api/profile/me  -> proxies to your Express API
export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const base = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:8000";
  const cookies = req.headers.cookie ? { cookie: req.headers.cookie } : {};
  // If you know your exact route, set it in .env.local as NEXT_PROFILE_ME_PATH=/user/me
  const override = process.env.NEXT_PROFILE_ME_PATH;

  const candidates = override
    ? [override]
    : [
        "/user/me",
        "/user/profile",
        "/me",
        "/user", // <- many APIs return the current user here
        "/auth/me",
        "/users/me",
        "/profile",
        "/profile/me",
        "/account/me",
      ];

  try {
    let upstream,
      chosen = null;
    for (const p of candidates) {
      const r = await fetch(`${base}${p}`, { method: "GET", headers: cookies });
      if (![404, 405].includes(r.status)) {
        upstream = r;
        chosen = p;
        break;
      }
    }
    if (!upstream)
      return res
        .status(404)
        .json({ error: "Profile endpoint not found in upstream" });

    const setCookies =
      upstream.headers.getSetCookie?.() ||
      upstream.headers.raw?.()["set-cookie"] ||
      [];
    if (setCookies.length) res.setHeader("Set-Cookie", setCookies);

    res.setHeader("X-Upstream-Path", chosen);
    const text = await upstream.text();
    try {
      return res.status(upstream.status).json(JSON.parse(text));
    } catch {
      return res.status(upstream.status).send(text);
    }
  } catch (e) {
    console.error("profile/me proxy error:", e);
    return res.status(502).json({ error: "Bad gateway" });
  }
}
