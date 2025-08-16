// POST /api/profile/change-password -> proxies to your Express API
export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const base = process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:8000';
  const cookies = req.headers.cookie ? { cookie: req.headers.cookie } : {};
  const body =
    typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

  // Optional env:
  // NEXT_PROFILE_CHANGE_PASSWORD_PATH=/user/change-password
  // NEXT_PROFILE_CHANGE_PASSWORD_METHOD=POST
  const oPath = process.env.NEXT_PROFILE_CHANGE_PASSWORD_PATH;
  const oMethod = (
    process.env.NEXT_PROFILE_CHANGE_PASSWORD_METHOD || 'POST'
  ).toUpperCase();

  const candidates = oPath
    ? [{ m: oMethod, p: oPath }]
    : [
        { m: 'POST', p: '/user/change-password' },
        { m: 'POST', p: '/user/password' },
        { m: 'POST', p: '/auth/change-password' },
        { m: 'PUT', p: '/profile/password' },
      ];

  try {
    let upstream,
      chosen = null;
    for (const { m, p } of candidates) {
      const r = await fetch(`${base}${p}`, {
        method: m,
        headers: { 'Content-Type': 'application/json', ...cookies },
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
        .json({ error: 'Password endpoint not found in upstream' });

    const setCookies =
      upstream.headers.getSetCookie?.() ||
      upstream.headers.raw?.()['set-cookie'] ||
      [];
    if (setCookies.length) res.setHeader('Set-Cookie', setCookies);

    res.setHeader('X-Upstream-Path', chosen);
    const text = await upstream.text();
    try {
      return res.status(upstream.status).json(JSON.parse(text));
    } catch {
      return res.status(upstream.status).send(text);
    }
  } catch (e) {
    console.error('profile/change-password proxy error:', e);
    return res.status(502).json({ error: 'Bad gateway' });
  }
}
