export default async function handler(req, res) {
  try {
      const { categoryId } = req.query;
      const url = `${process.env.NODE_HOST}/api/product/getAllProduct?categoryId=${encodeURIComponent(categoryId)}`;
  
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
  
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err) {
      return res.status(500).json({ message: 'Proxy error', error: err.message });
    }
}
