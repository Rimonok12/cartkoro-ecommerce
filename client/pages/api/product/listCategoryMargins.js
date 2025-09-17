// export default async function handler(req, res) {
//     try {
//         const url = `${process.env.NODE_HOST}/api/product/listCategoryMargins`;
    
//         const response = await fetch(url, {
//           method: 'GET',
//           headers: { 'Content-Type': 'application/json' }
//         });
    
//         const data = await response.json();
//         return res.status(response.status).json(data);
//       } catch (err) {
//         return res.status(500).json({ message: 'Proxy error', error: err.message });
//       }
//   }


import { forwardCookies } from "@/lib/forwardCookies";

export default async function handler(req, res) {
  try {

    const url = new URL(`${process.env.NODE_HOST}/api/product/listCategoryMargins`);
    // forward query params
    Object.entries(req.query).forEach(([k, v]) => {
      if (v != null) url.searchParams.append(k, v);
    });

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
