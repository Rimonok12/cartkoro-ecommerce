const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  createVariant,
  getVariants,
  createProduct,
  getAllProducts,
  getProductBySkuId,
} = require("../controllers/productController");
const { auth, adminOnly } = require("../middleware/auth");

router.post("/createCategory", auth, adminOnly, createCategory);
router.get("/getCategories", getCategories);
router.post("/createVariant", auth, adminOnly, createVariant);
router.get("/getVariants/:categoryId", getVariants);
router.post("/createProduct", auth, adminOnly, createProduct);
router.get("/getAllProducts", getAllProducts);
router.get("/getProductBySkuId/:skuId", getProductBySkuId);

module.exports = router;
