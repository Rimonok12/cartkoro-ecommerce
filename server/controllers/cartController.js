// server/controllers/cartController.js
const { getHash, setHash } = require("../config/redisClient");

// Merge helper (accumulate by sku_id)
function mergeItemsBySku(base = [], incoming = []) {
  const qty = new Map();
  for (const it of Array.isArray(base) ? base : []) {
    if (it && it.sku_id) qty.set(it.sku_id, (qty.get(it.sku_id) || 0) + Number(it.quantity || 0));
  }
  for (const it of Array.isArray(incoming) ? incoming : []) {
    if (it && it.sku_id) qty.set(it.sku_id, (qty.get(it.sku_id) || 0) + Number(it.quantity || 1));
  }
  return Array.from(qty.entries()).map(([sku_id, q]) => ({
    sku_id,
    quantity: Math.max(1, Number(q) || 1),
  }));
}

const updateCart = async (req, res) => {
  try {
    const { items = [], merge = true } = req.body; // <-- merge controls behavior
    const userKey = `user:${req.user.userId}`;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Cart items must be an array" });
    }

    // 1) Read existing from Redis
    let existing = await getHash(userKey, "cart");
    if (typeof existing === "string") {
      try { existing = JSON.parse(existing); } catch { existing = null; }
    }
    const existingItems = Array.isArray(existing?.items) ? existing.items : [];

    // 2) Merge OR Replace
    let finalItems;
    if (merge) {
      finalItems = mergeItemsBySku(existingItems, items);
    } else {
      // REPLACE mode: take payload as the new source of truth; drop 0/negative
      finalItems = items
        .filter(it => it && it.sku_id && Number(it.quantity) > 0)
        .map(it => ({
          sku_id: it.sku_id,
          quantity: Math.max(1, Number(it.quantity) || 1),
        }));
    }

    // 3) Save
    const cartData = { items: finalItems };
    await setHash(userKey, "cart", JSON.stringify(cartData));

    return res.json({ message: "Cart updated", cart: cartData });
  } catch (err) {
    console.error("updateCart error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { updateCart };
