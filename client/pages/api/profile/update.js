// PUT /api/profile/update -> proxies to your Express API
export default async function handler(req, res) {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "Method not allowed" });

  const base = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:8000";
  const cookies = req.headers.cookie ? { cookie: req.headers.cookie } : {};
  const body =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});

  // Optional env overrides:
  // NEXT_PROFILE_UPDATE_PATH=/user/profile
  // NEXT_PROFILE_UPDATE_METHOD=PUT  (or POST)
  const oPath = process.env.NEXT_PROFILE_UPDATE_PATH;
  const oMethod = (
    process.env.NEXT_PROFILE_UPDATE_METHOD || "PUT"
  ).toUpperCase();

  const candidates = oPath
    ? [{ m: oMethod, p: oPath }]
    : [
        { m: "PUT", p: "/user/profile" },
        { m: "PUT", p: "/user/me" },
        { m: "POST", p: "/user/update" },
        { m: "PUT", p: "/profile" },
        { m: "POST", p: "/profile/update" },
        { m: "PUT", p: "/account/profile" },
      ];

  try {
    let upstream,
      chosen = null;
    for (const { m, p } of candidates) {
      const r = await fetch(`${base}${p}`, {
        method: m,
        headers: { "Content-Type": "application/json", ...cookies },
        body,
      });
      if (![404, 405].includes(r.status)) {
        upstream = r;
        chosen = `${m} ${p}`;
        break;
      }
    }
    if (!upstream)
      return res
        .status(404)
        .json({ error: "Profile update endpoint not found in upstream" });

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
    console.error("profile/update proxy error:", e);
    return res.status(502).json({ error: "Bad gateway" });
  }
}
