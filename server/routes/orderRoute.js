const express = require("express");
const router = express.Router();
const {
  getUserOrders,
  createOrder,
  getSellerOrderItems,
} = require("../controllers/orderController");
const { auth, allowRoles } = require("../middleware/auth");

router.get("/getUserOrders", auth, getUserOrders);
router.post("/createOrder", auth, createOrder);
router.get(
  "/getSellerOrderItems",
  auth,
  allowRoles("seller"),
  getSellerOrderItems
);

module.exports = router;
