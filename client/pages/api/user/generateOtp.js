// export default async function handler(req, res) {
//   try {
//       const url = `${process.env.NODE_HOST}/api/user/generateOtp`;

//       const response = await fetch(url, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(req.body),
//       });

//       const data = await response.json();
//       return res.status(response.status).json(data);
//     } catch (err) {
//       return res.status(500).json({ message: 'Proxy error', error: err.message });
//     }
//   }

// pages/api/user/generateOtp.js
// SERVER HANDLER — no React, no hooks here.
// pages/api/user/generateOtp.js
// SERVER HANDLER — no React here.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone, countryCode } = req.body || {};
    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }

    const apiBase =
      process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:8000";

    // Try several likely backend paths (first one that isn't 404 wins)
    const candidates = [
      "/user/generateOtp",
      "/api/user/generateOtp",
      "/user/generate-otp",
      "/api/user/generate-otp",
      "/auth/generateOtp",
      "/otp/generate",
    ];

    let upstream,
      chosen = null;
    for (const path of candidates) {
      const resp = await fetch(`${apiBase}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, countryCode }),
      });
      if (resp.status !== 404) {
        upstream = resp;
        chosen = path;
        break;
      }
    }

    if (!upstream) {
      return res
        .status(502)
        .json({ error: "Upstream not reachable (all candidates 404)" });
    }

    // Forward Set-Cookie from upstream (Next/undici compat)
    const setCookies =
      upstream.headers.getSetCookie?.() ||
      upstream.headers.raw?.()["set-cookie"] ||
      [];
    if (setCookies.length) res.setHeader("Set-Cookie", setCookies);

    // Pass through body & status
    let body;
    const text = await upstream.text(); // keep original
    try {
      body = JSON.parse(text);
    } catch {
      body = text || {};
    }

    // Optional: attach which path matched for debugging (non-200 only)
    if (
      !upstream.ok &&
      typeof body === "object" &&
      body &&
      !Array.isArray(body)
    ) {
      body.__upstream = chosen;
    }

    return res.status(upstream.status).json(body);
  } catch (err) {
    console.error("generateOtp proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
