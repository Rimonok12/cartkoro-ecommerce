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

/* ======================= Variant Definition ======================= */
/**
 * Defines what variants a category supports
 * Example: For Mobiles -> [color, ram, storage]
 * Example: For Clothes -> [size, color]
 */
const variantSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    name: { type: String, required: true }, // e.g. "color", "ram", "storage"
    values: { type: [String], default: [] }, // e.g. ["Black", "White"], ["6GB","8GB"]
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
    status: { type: Number, default: 1 },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference the User model
      required: true, // make it required if every product must belong to a user
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

productSchema.index({ category: 1, name: 1 });
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
    variant_values: { type: Map, of: String }, // key-value pairs based on category's variant schema
    initial_stock: { type: Number, required: true, min: 0 },
    sold_stock: { type: Number, default: 0, min: 0 },
    MRP: { type: Number, min: 0 },
    SP: { type: Number, min: 0 },
    thumbnail_img: { type: String },
    side_imgs: { type: [String], default: [] },
    status: { type: Number, default: 1 },
  },
  { timestamps: true, versionKey: false }
);

productSkuSchema.path("SP").validate(function (v) {
  if (!this.MRP) return true;
  return v <= this.MRP;
}, "SP cannot be greater than MRP");

// Ensure unique combination of variants per product
productSkuSchema.index(
  { product_id: 1, variant_values: 1 },
  { unique: true, name: "uniq_sku_per_product_variant" }
);
productSkuSchema.index({ SP: 1 });

/* ======================= Exports ======================= */
const Category = mongoose.model("Category", categorySchema);
const Product = mongoose.model("Product", productSchema);
const Variant = mongoose.model("Variant", variantSchema);
const ProductSku = mongoose.model("ProductSku", productSkuSchema);

module.exports = {
  Category,
  Product,
  Variant,
  ProductSku,
};
