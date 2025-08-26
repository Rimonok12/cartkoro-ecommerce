import { forwardCookies } from "@/lib/forwardCookies";

export default async function handler(req, res) {
  try {
    const url = `${process.env.NODE_HOST}/api/user/deleteAddress/${req.query.addressId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || "",
      },
      credentials: "include",
      body: JSON.stringify(req.body),
    });

    forwardCookies(response, res);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ message: "Proxy error", error: err.message });
  }
}
