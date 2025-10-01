import { forwardCookies } from "@/lib/forwardCookies";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Collect filters from the client request
    const { page, limit, q, role, status } = req.query;

    // Build target URL on your Node server
    const base = `${process.env.NODE_HOST}/api/user/listUsersForAdmin`;
    const sp = new URLSearchParams();
    if (page) sp.set("page", page);
    if (limit) sp.set("limit", limit);
    if (q) sp.set("q", q);
    if (role) sp.set("role", role);       // super_admin | admin | seller
    if (status !== undefined) sp.set("status", status); // e.g. "1" or "0"
    const url = sp.toString() ? `${base}?${sp.toString()}` : base;

    // Forward the request to Node server
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // pass through bearer if present
        Authorization: req.headers.authorization || "",
        // also forward incoming cookies (helps when backend checks cookies)
        Cookie: req.headers.cookie || "",
      },
      credentials: "include",
    });

    // Mirror Set-Cookie headers from backend -> client
    forwardCookies(response, res);

    // Relay the JSON payload & status
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy /api/user/admin/list error:", err);
    return res.status(500).json({ message: "Proxy error", error: err.message });
  }
}
