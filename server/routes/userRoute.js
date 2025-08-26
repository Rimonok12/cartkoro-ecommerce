const express = require("express");
const router = express.Router();
const {
  generateOtp,
  verifyOtp,
  refresh,
  logout,
  register,
  getUserRedisData,
} = require("../controllers/userController");
const { updateCart } = require("../controllers/cartController");
const {
  addAddress,
  getAddresses,
  editAddress,
  deleteAddress,
} = require("../controllers/addressController");
const { auth } = require("../middleware/auth");

router.post("/generateOtp", generateOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/register", auth, register);
router.post("/logout", logout);
router.post("/refresh", refresh);

router.post("/getUserRedisData", getUserRedisData);

router.post("/updateCart", auth, updateCart);

router.post("/addAddress", auth, addAddress);
router.post("/getAddresses", auth, getAddresses);
router.put("/editAddress/:addressId", auth, editAddress);
router.delete("/deleteAddress/:addressId", auth, deleteAddress);

module.exports = router;
