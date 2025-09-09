const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  createBrand,
  getBrands,
  createVariant,
  getVariants,
  createProduct,
  getAllProducts,
  getProductBySkuId,
  getAllProductsBySeller,
} = require("../controllers/productController");
const {
  pendingProductsList,
  approvedProducts,
  upsertCategoryMargin,
} = require("../controllers/productModeration");
const { auth, allowRoles } = require("../middleware/auth");

router.post("/createCategory", auth, allowRoles("admin"), createCategory);
router.get("/getCategories", getCategories);
router.post("/createBrand", auth, allowRoles("admin"), createBrand);
router.get("/getBrands/:categoryId", getBrands);
router.post("/createVariant", auth, allowRoles("admin"), createVariant);
router.get("/getVariants/:categoryId", getVariants);
router.post("/createProduct", auth, allowRoles("seller"), createProduct);
router.get("/getAllProducts", getAllProducts);
router.get("/getProductBySkuId/:skuId", getProductBySkuId);
router.get(
  "/pendingProductsList",
  auth,
  allowRoles("admin"),
  getProductBySkuId
);
router.get("/approvedProducts", auth, allowRoles("admin"), getProductBySkuId);
router.post(
  "/upsertCategoryMargin",
  auth,
  allowRoles("admin"),
  upsertCategoryMargin
);
router.get(
  "/getAllProductsBySeller",
  auth,
  allowRoles("seller"),
  getAllProductsBySeller
);

module.exports = router;
