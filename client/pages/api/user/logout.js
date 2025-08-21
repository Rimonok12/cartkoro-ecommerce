import { forwardCookies } from "@/lib/forwardCookies";

export default async function handler(req, res) {
  try {
    const url = `${process.env.NODE_HOST}/api/user/logout`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || "",
        cookie: req.headers.cookie || "", // forward client cookies
      },
    });

    // Forward backend cookies to the client
    forwardCookies(response, res);

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ message: "Proxy error", error: err.message });
  }
}
