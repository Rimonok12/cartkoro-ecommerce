// // lib/forwardCookies.js
// export function forwardCookies(fromResponse, toResponse) {
//     const cookies = fromResponse.headers.get('set-cookie');
//     if (cookies) {
//       // Pass cookies directly to the browser
//       toResponse.setHeader('set-cookie', cookies);
//     }
//   }
// Rewrites Set-Cookie from the backend so they stick to your FE origin.
export function forwardCookies(upstream, res) {
  const setCookies =
    upstream.headers.getSetCookie?.() ||
    upstream.headers.raw?.()["set-cookie"] ||
    upstream.headers.get?.("set-cookie") ||
    [];

  const list = Array.isArray(setCookies)
    ? setCookies
    : [setCookies].filter(Boolean);
  if (!list.length) return;

  const rewritten = list.map((c) => {
    let v = String(c);
    // bind to current FE host (strip backend domain)
    v = v.replace(/;\s*Domain=[^;]+/gi, "");
    // normalize path
    if (/;\s*Path=/i.test(v)) v = v.replace(/;\s*Path=[^;]*/i, "; Path=/");
    else v += "; Path=/";
    // ensure SameSite present
    if (!/;\s*SameSite=/i.test(v)) v += "; SameSite=Lax";
    // SameSite=None must be Secure
    if (/SameSite=None/i.test(v) && !/;\s*Secure/i.test(v)) v += "; Secure";
    return v;
  });

  res.setHeader("Set-Cookie", rewritten);
}
