// import { forwardCookies } from '@/lib/forwardCookies';

// export default async function handler(req, res) {
//   try {
//     const url = `${process.env.NODE_HOST}/api/order/createOrder`;
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: req.headers.authorization || ''
//       },
//       credentials: 'include',
//       body: JSON.stringify(req.body),
//     });

//     forwardCookies(response, res);
//     const data = await response.json();
//     return res.status(response.status).json(data);
//   } catch (err) {
//     return res.status(500).json({ message: 'Proxy error', error: err.message });
//   }
// }

import { forwardCookies } from "@/lib/forwardCookies";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const url = `${process.env.NODE_HOST}/api/order/createOrder`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || "",
        Cookie: req.headers.cookie || "",
      },
      body: JSON.stringify(req.body || {}),
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
      .json({ message: "Proxy error (create order)", error: err.message });
  }
}
