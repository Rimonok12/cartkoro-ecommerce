// models/productModels.js
const mongoose = require("mongoose");

/* ======================= Category ======================= */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, // parent
  },
  { timestamps: true, versionKey: false }
);
categorySchema.pre("validate", function (next) {
  if (!this.level) this.level = this._id;
  next();
});
categorySchema.index({ level: 1, name: 1 }, { unique: true });

/* ======================= Brand ======================= */
const brandSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true, versionKey: false }
);
brandSchema.index({ category_id: 1, name: 1 }, { unique: true });

/* ======================= Variant Definition ======================= */
const variantSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    values: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false }
);
variantSchema.index({ category_id: 1, name: 1 }, { unique: true });

/* ======================= Product ======================= */
const productSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      index: true,
    },
    status: { type: Number, default: 1 },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    details: {
      type: [
        {
          key: { type: String, required: true, trim: true },   // e.g. "Brand Color"
          value: { type: String, required: true, trim: true }, // e.g. "White"
        },
      ],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);
// fix index key
productSchema.index({ category_id: 1, name: 1 });
productSchema.index({ createdAt: -1 });

/* ======================= Product SKU ======================= */
const productSkuSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variant_values: { type: Map, of: String },
    initial_stock: { type: Number, required: true, min: 0 },
    sold_stock: { type: Number, default: 0, min: 0 },

    // ✅ seller-entered prices (as provided by seller; stored for audit/display)
    seller_mrp: { type: Number, min: 0 },
    seller_sp: { type: Number, min: 0 },

    // ✅ final prices after applying admin/category margin band, etc.
    MRP: { type: Number, min: 0 },
    SP: { type: Number, min: 0 },

    thumbnail_img: { type: String },
    side_imgs: { type: [String], default: [] },
    status: { type: Number, default: 1 },
  },
  { timestamps: true, versionKey: false }
);

// validations
productSkuSchema.path("seller_sp").validate(function (v) {
  if (this.seller_mrp == null || v == null) return true;
  return v <= this.seller_mrp;
}, "seller_sp cannot be greater than seller_mrp");

productSkuSchema.path("SP").validate(function (v) {
  if (this.MRP == null || v == null) return true;
  return v <= this.MRP;
}, "SP cannot be greater than MRP");

// unique combo of variant values under product
productSkuSchema.index(
  { product_id: 1, variant_values: 1 },
  { unique: true, name: "uniq_sku_per_product_variant" }
);
productSkuSchema.index({ SP: 1 });

/* ======================= Category Margin (with band) ======================= */
const categoryMarginSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      unique: true,
      index: true,
    },
    sp_percent: { type: Number, default: 0, min: -100, max: 1000 },
    mrp_percent: { type: Number, default: 0, min: -100, max: 1000 },

    // ✅ default band 0..500000 inclusive
    price_min: { type: Number, default: 0, min: 0 },
    price_max: { type: Number, default: 500000, min: 0 },

    is_active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);
categoryMarginSchema.pre("validate", function (next) {
  if (typeof this.price_min !== "number") this.price_min = 0;
  if (typeof this.price_max !== "number") this.price_max = 500000;
  if (this.price_max < this.price_min) this.price_max = this.price_min;
  next();
});
categoryMarginSchema.index({ category_id: 1, is_active: 1 });

/* ======================= Exports ======================= */
const Category = mongoose.model("Category", categorySchema);
const Brand = mongoose.model("Brand", brandSchema);
const Product = mongoose.model("Product", productSchema);
const Variant = mongoose.model("Variant", variantSchema);
const ProductSku = mongoose.model("ProductSku", productSkuSchema);
const CategoryMargin = mongoose.model("CategoryMargin", categoryMarginSchema);

module.exports = {
  Category,
  Brand,
  Product,
  Variant,
  ProductSku,
  CategoryMargin,
};
