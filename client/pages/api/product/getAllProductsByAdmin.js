import { forwardCookies } from "@/lib/forwardCookies";

export default async function handler(req, res) {
  try {
    const { categoryId } = req.query;
    let url;
    if (categoryId) {
      url = `${
        process.env.NODE_HOST
      }/api/product/getAllProductsByAdmin?categoryId=${encodeURIComponent(
        categoryId
      )}`;
    } else {
      url = `${process.env.NODE_HOST}/api/product/getAllProductsByAdmin`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || "",
      },
      credentials: "include",
    });

    forwardCookies(response, res);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ message: "Proxy error", error: err.message });
  }
}
