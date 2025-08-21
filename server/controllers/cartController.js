// server/controllers/cartController.js
const { setHash } = require("../config/redisClient");

const updateCart = async (req, res) => {
  try {
    const { items } = req.body;
    const userKey = `user:${req.user.userId}`;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Cart items must be an array" });
    }

    const cartData = { items };

    await setHash(userKey, "cart", cartData);

    res.json({ message: "Item added in Cart" });
  } catch (err) {
    console.error("updateCart error:", err);
    res.status(500).json({ error: "Server error" });
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
