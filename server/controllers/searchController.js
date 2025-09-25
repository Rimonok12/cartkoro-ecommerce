// server/controllers/searchController.js
const meili = require("../config/meili");
const meiliIndex = () => meili.index(process.env.MEILI_INDEX);


const searchProducts = async (req, res) => {
  try {
    const {
      q = "",
      page = "1",
      hitsPerPage = "12",
      brand,
      category,
      color,
      size,
      minPrice,
      maxPrice,
      sort
    } = req.query;

    const filters = [];
    if (brand)    filters.push(`brand = "${String(brand)}"`);
    if (category) filters.push(`categories = "${String(category)}"`);
    if (color)    filters.push(`colors = "${String(color)}"`);
    if (size)     filters.push(`size = "${String(size)}"`);         // 👈 single-size per SKU now
    if (minPrice) filters.push(`price >= ${Number(minPrice)}`);
    if (maxPrice) filters.push(`price <= ${Number(maxPrice)}`);

    const result = await meiliIndex().search(String(q), {
      filter: filters.length ? filters : undefined,
      limit: Number(hitsPerPage),
      offset: (Number(page) - 1) * Number(hitsPerPage),
      sort: sort ? [String(sort)] : undefined,
      attributesToHighlight: ["title", "description"],
      attributesToRetrieve: [
        "id",            // 👈 SKU id (doc id)
        "skuId",         // duplicate, if you prefer this on FE
        "productId",
        "title",
        "brand",
        "categories",
        "price",
        "thumbnail"
      ],
    });

    res.json({
      hits: result.hits,
      total: result.estimatedTotalHits,
      page: Number(page),
      hitsPerPage: Number(hitsPerPage),
    });
  } catch (err) {
    console.error("searchProducts error:", err);
    return res.status(500).json({ message: "Internal error", error: err.message });
  }
};

const healthCheck = async (_req, res) => {
  try {
    const h = await meili.health();
    res.json({ ok: true, meili: h });
  } catch (err) {
    console.error("healthCheck error:", err);
    return res.status(500).json({ message: "Internal error", error: err.message });
  }
};

module.exports = { searchProducts, healthCheck };
