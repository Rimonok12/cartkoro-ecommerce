const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductBySkuId,
  getAllProductsBySeller,
  getAllProductsByAdmin,
  getHomeCategories,
  getAllFeaturedProducts
} = require("../controllers/productController");
const {
  pendingProductsList,
  approvedProducts,
  createCategory,
  getCategories,
  createBrand,
  getBrands,
  createVariant,
  getVariants,
  upsertCategoryMargin,
  listCategoryMargins
} = require("../controllers/productModeration");
const { 
  healthCheck,
  seedMeili,
  searchProducts
} = require("../controllers/searchController");
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
router.get("/listCategoryMargins", auth, allowRoles("admin"), listCategoryMargins)

router.get(
  "/getAllProductsBySeller",
  auth,
  allowRoles("seller"),
  getAllProductsBySeller
);
router.get("/getAllProductsByAdmin", auth, allowRoles("admin"), getAllProductsByAdmin)
router.get("/getHomeCategories", getHomeCategories);

router.post("/getAllFeaturedProducts", getAllFeaturedProducts)


router.get("/health", healthCheck);
router.get("/seedMeili", seedMeili);
router.get("/searchProducts", searchProducts);


module.exports = router;
