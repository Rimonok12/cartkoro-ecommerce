// server/controllers/cartController.js
const { getHash, setHash } = require("../config/redisClient");

// const updateCart = async (req, res) => {
//   try {
//     const { items } = req.body;
//     const userKey = `user:${req.user.userId}`;

//     if (!Array.isArray(items)) {
//       return res.status(400).json({ error: "Cart items must be an array" });
//     }

//     const cartData = { items };

//     await setHash(userKey, "cart", cartData);

//     res.json({ message: "Item added in Cart" });
//   } catch (err) {
//     console.error("updateCart error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };
const updateCart = async (req, res) => {
  try {
    const { items = [], merge = true } = req.body;
    const userKey = `user:${req.user.userId}`;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Cart items must be an array" });
    }

    // 1) Load existing cart from Redis
    // getHash should return the stored value or null.
    // If your getHash returns strings, JSON.parse it.
    let existingCart = await getHash(userKey, "cart");
    if (typeof existingCart === "string") {
      try { existingCart = JSON.parse(existingCart); } catch { existingCart = null; }
    }
    const existingItems = Array.isArray(existingCart?.items) ? existingCart.items : [];

    // 2) Build final list (merge or replace)
    let finalItems = [];
    if (merge) {
      // Merge: accumulate quantities by sku_id
      const qtyBySku = new Map();
      for (const it of existingItems) {
        if (it && it.sku_id) {
          qtyBySku.set(it.sku_id, (qtyBySku.get(it.sku_id) || 0) + Number(it.quantity || 0));
        }
      }
      for (const it of items) {
        if (it && it.sku_id) {
          qtyBySku.set(it.sku_id, (qtyBySku.get(it.sku_id) || 0) + Number(it.quantity || 1));
        }
      }
      finalItems = Array.from(qtyBySku.entries()).map(([sku_id, quantity]) => ({
        sku_id,
        quantity: Math.max(1, Number(quantity) || 1),
      }));
    } else {
      // Replace: just keep valid items
      finalItems = items
        .filter((it) => it && it.sku_id)
        .map((it) => ({
          sku_id: it.sku_id,
          quantity: Math.max(1, Number(it.quantity) || 1),
        }));
    }

    // 3) Save back to Redis
    const cartData = { items: finalItems };
    await setHash(userKey, "cart", cartData); // if your setHash expects a string, do JSON.stringify(cartData)

    return res.json({ message: "Cart updated", cart: cartData });
  } catch (err) {
    console.error("updateCart error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


module.exports = { updateCart };

// curl -X POST http://localhost:8000/user/updateCart \
//   -H "Content-Type: application/json" \
//   -H "Authorization: Bearer <your_access_token>" \
//   -d '{
//     "items": [
//       {"sku_id": "66c8f1abcdef123456789012", "quantity": 2 },
//       {"sku_id": "66c8a3abcdef123456789012", "quantity": 1 }
//     ]
//   }'
