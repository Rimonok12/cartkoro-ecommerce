// models/product.js
const mongoose = require('mongoose');

/* ======================= Category ======================= */
/**
 * Simple hierarchy:
 * - Root: level = _id
 * - Child: level = parent _id
 * Unique per parent: (level, name)
 */
const categorySchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    level: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // parent id OR self id
  },
  { timestamps: true, versionKey: false }
);

// Auto-set level=self for roots when level not provided
categorySchema.pre('validate', function (next) {
  if (!this.level) this.level = this._id;
  next();
});

// Same name allowed under different parents; disallow duplicates under same parent
categorySchema.index({ level: 1, name: 1 }, { unique: true, name: 'uniq_category_per_parent' });


/* ======================= Product ======================= */
const productSchema = new mongoose.Schema(
  {
    category:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name:          { type: String, required: true, trim: true },
    description:   { type: String },
    MRP:           { type: Number, required: true, min: 0 },
    SP:            { type: Number, required: true, min: 0 },
    thumbnail_url: { type: String },
    thumbnail_img: { type: String },
    side_imgs:     { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false }
);

// Business rule: SP should not exceed MRP
productSchema.path('SP').validate(function (v) {
  if (this.MRP == null) return true;
  return v <= this.MRP;
}, 'SP cannot be greater than MRP');

// Useful indexes (category lists, freshness, pricing sorts)
productSchema.index({ category: 1, name: 1 }, { name: 'idx_product_category_name' });
productSchema.index({ createdAt: -1 }, { name: 'idx_product_createdAt_desc' });
productSchema.index({ SP: 1 }, { name: 'idx_product_SP_asc' });


/* ======================= Product Stock (optional) ======================= */
/**
 * If you manage stock per Product (not per SKU), keep this.
 * If you manage stock per SKU, you can remove this model.
 */
const productStockSchema = new mongoose.Schema(
  {
    product_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true, index: true },
    initial_stock: { type: Number, required: true, min: 0 },
    sold_stock:    { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

productStockSchema.virtual('available_stock').get(function () {
  return Math.max(0, (this.initial_stock || 0) - (this.sold_stock || 0));
});


/* ======================= Product SKUs ======================= */
/**
 * For variants (e.g., size/color). If you rely on SKUs for stock,
 * you may not need ProductStock.
 */
const productSkuSchema = new mongoose.Schema(
  {
    product_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant:        { type: Object },     // e.g., { color: 'Black', storage: '128GB' }
    price_override: { type: Number, min: 0 },
    stock:          { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

// Example: if you standardize variant keys and want uniqueness per product, uncomment & adapt:
// productSkuSchema.index({ product_id: 1, 'variant.color': 1, 'variant.size': 1 }, { unique: true });


/* ======================= Exports ======================= */
module.exports = {
  Category: mongoose.model('Category', categorySchema),
  Product: mongoose.model('Product', productSchema),
  ProductStock: mongoose.model('ProductStock', productStockSchema),
  ProductSku: mongoose.model('ProductSku', productSkuSchema),
};
