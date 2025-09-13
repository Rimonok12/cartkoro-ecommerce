const express = require("express");
const router = express.Router();
const {
  getOrderStatuses,
  getUserOrders,
  createOrder,
  getSellerOrderItems,
  getAdminOrders,
  getOrderDetails
} = require("../controllers/orderController");
const { auth, allowRoles } = require("../middleware/auth");

router.get("/getOrderStatuses", auth, getOrderStatuses);

router.get("/getUserOrders", auth, getUserOrders);
router.post("/createOrder", auth, createOrder);
router.get(
  "/getSellerOrderItems",
  auth,
  allowRoles("seller"),
  getSellerOrderItems
);
router.get("/getAdminOrders", auth, allowRoles("admin"), getAdminOrders);

router.get("/getOrderDetails/:orderId", auth, getOrderDetails);



module.exports = router;
