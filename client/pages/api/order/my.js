import { forwardCookies } from "@/lib/forwardCookies";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const url = `${process.env.NODE_HOST}/api/order/getUserOrders`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || "",
        Cookie: req.headers.cookie || "",
      },
    });

    forwardCookies(response, res);

    let data;
    try {
      data = await response.json();
    } catch {
      data = { message: "Upstream returned no JSON body" };
    }

    return res.status(response.status).json(data);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Proxy error (get user orders)", error: err.message });
  }
}
