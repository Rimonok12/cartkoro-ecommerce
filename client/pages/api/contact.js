// pages/api/contact.js
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const base = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:8000";
  const cookies = req.headers.cookie ? { cookie: req.headers.cookie } : {};
  const body =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});

  // Set NEXT_CONTACT_PATH in .env.local to pin your real route, e.g. /support/contact
  const override = process.env.NEXT_CONTACT_PATH;
  const candidates = override
    ? [override]
    : ["/support/contact", "/contact", "/api/contact", "/help/contact"];

  try {
    let upstream = null,
      chosen = null;
    for (const p of candidates) {
      const r = await fetch(`${base}${p}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cookies },
        body,
      });
      if (![404, 405].includes(r.status)) {
        upstream = r;
        chosen = p;
        break;
      }
    }
    if (!upstream) {
      return res.status(501).json({
        error: "No contact endpoint configured on upstream",
        hint: "Set NEXT_CONTACT_PATH in .env.local to your backend route (e.g. /support/contact)",
      });
    }

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
    console.error("contact proxy error:", e);
    return res.status(502).json({ error: "Bad gateway" });
  }
}
