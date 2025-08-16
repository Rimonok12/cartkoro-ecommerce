import { forwardCookies } from '@/lib/forwardCookies';

export default async function handler(req, res) {
  try {
    const url = `${process.env.NODE_HOST}/api/user/refresh`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.cookie || ''
      }
    });

    forwardCookies(response, res);

    // Safely parse only if JSON
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Refresh returned non-JSON:', text);
      return res.status(500).json({ error: 'Invalid refresh response' });
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy refresh error:', err);
    return res.status(500).json({ message: 'Proxy error', error: err.message });
  }
}
