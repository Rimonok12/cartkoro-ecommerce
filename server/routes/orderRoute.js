const express = require("express");
const router = express.Router();
const {
  getUserOrders,
  createOrder,
  getSellerOrderItems,
  getAdminOrders,
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
router.get("/getAdminOrders", auth, allowRoles("admin"), getAdminOrders);

module.exports = router;
