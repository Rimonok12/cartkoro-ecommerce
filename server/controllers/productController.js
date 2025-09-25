const {
  Category,
  Brand,
  Product,
  Variant,
  ProductSku,
  CategoryMargin,
} = require("../models/productModels");
const mongoose = require("mongoose");


const createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { categoryId, brandId, name, description, variantRows, details } = req.body;
    // variantRows expected like:
    // [{ values: {...}, totalStock, sellerMRP, sellerSP, thumbnail_img, side_imgs }]
    if (
      !categoryId ||
      !name ||
      !Array.isArray(variantRows) ||
      variantRows.length === 0
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const sellerId = req.user?.userId;

    // Load active margin band (defaults 0..500000)
    const margin = await CategoryMargin.findOne({
      category_id: categoryId,
      is_active: true,
    })
      .session(session)
      .lean();

    const inBand = (price) => {
      if (!margin) return true;
      const min = typeof margin.price_min === "number" ? margin.price_min : 0;
      const max =
        typeof margin.price_max === "number" ? margin.price_max : 500000;
      if (typeof price !== "number") return false;
      return price >= min && price <= max;
    };

    const applyPct = (val, pct) => {
      if (typeof val !== "number") return val;
      if (typeof pct !== "number") return val;
      return Math.round(val * (1 + pct / 100));
    };

    // 1) Product
    const product = await Product.create(
      [
        {
          category_id: categoryId,
          name,
          brandId,
          description,
          status: 1,
          userId: sellerId,
          details: Array.isArray(details)
            ? details
                .filter((d) => d?.key && d?.value)
                .map((d) => ({
                  key: String(d.key).trim(),
                  value: String(d.value).trim(),
                }))
            : [],
        },
      ],
      { session }
    ).then((arr) => arr[0]);

    // 2) SKUs with seller+final prices
    const skuDocs = variantRows.map((v) => {
      // seller provided
      const sMRP = Number(v.sellerMRP ?? v.MRP ?? 0) || 0;
      let sSP = Number(v.sellerSP ?? v.SP ?? 0) || 0;
      if (sSP > sMRP) sSP = sMRP; // seller sanity

      // apply margin only if in band (based on seller MRP)
      let finalMRP = sMRP;
      let finalSP = sSP;
      if (margin && inBand(sMRP)) {
        if (typeof margin.mrp_percent === "number")
          finalMRP = applyPct(sMRP, margin.mrp_percent);
        if (typeof margin.sp_percent === "number")
          finalSP = applyPct(sSP, margin.sp_percent);
        if (finalSP > finalMRP) finalSP = finalMRP; // invariant
      }

      return {
        product_id: product._id,
        variant_values: v.values, // { color:'Black', size:'L' }
        initial_stock: Number(v.totalStock) || 0,
        // store seller originals
        seller_mrp: sMRP,
        seller_sp: sSP,
        // store final computed prices
        MRP: finalMRP,
        SP: finalSP,
        thumbnail_img: v.thumbnail_img,
        side_imgs: Array.isArray(v.side_imgs) ? v.side_imgs : [],
        status: 1,
      };
    });

    await ProductSku.insertMany(skuDocs, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ message: "Product Successfully Added" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("createProduct Error", error);
    return res.status(500).json({ error: error.message || error });
  }
};

/* ======================= HOME CATEGORIES ======================= */
const getHomeCategories = async (_req, res) => {
  try {
    // 1) Pull all categories: parents & children
    const all = await Category.find({}, { _id: 1, name: 1, level: 1 }).lean();

    const parents = all.filter((c) => String(c.level) === String(c._id));
    const children = all.filter((c) => String(c.level) !== String(c._id));

    // group children by parent (level)
    const childrenByParent = new Map(); // parentId -> [childCat]
    for (const ch of children) {
      const pid = String(ch.level);
      if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
      childrenByParent.get(pid).push(ch);
    }

    // 2) For thumbnail: find representative (oldest) active SKU per child category
    const childIds = children.map((c) => c._id);
    let repSkuByCategory = {};

    if (childIds.length) {
      // products under child categories
      const products = await Product.find(
        { status: 1, category_id: { $in: childIds } },
        { _id: 1, category_id: 1, createdAt: 1 }
      ).lean();

      const productIds = products.map((p) => p._id);

      // skus for those products (oldest first in DB fetch)
      const skus = await ProductSku.find(
        { product_id: { $in: productIds } },
        { _id: 1, product_id: 1, thumbnail_img: 1, status: 1, createdAt: 1 }
      )
        .sort({ createdAt: 1 })
        .lean();

      // first ACTIVE SKU per product
      const firstActiveSkuByProduct = {};
      for (const sku of skus) {
        const pid = String(sku.product_id);
        if (!firstActiveSkuByProduct[pid] && sku.status === 1) {
          firstActiveSkuByProduct[pid] = sku;
        }
      }

      // choose the oldest product (that has an active sku) per category
      const productsSorted = [...products].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      repSkuByCategory = {};
      for (const p of productsSorted) {
        const sku = firstActiveSkuByProduct[String(p._id)];
        if (!sku) continue;
        const catId = String(p.category_id);
        if (!repSkuByCategory[catId]) {
          repSkuByCategory[catId] = sku;
        }
      }
    }

    // 3) Build final grouped shape
    const result = parents
      .map((parent) => {
        const kids = (childrenByParent.get(String(parent._id)) || []).map(
          (c) => {
            const sku = repSkuByCategory[String(c._id)];
            return {
              _id: c._id,
              name: c.name,
              sku_id: sku?._id || null,
              thumbnail_img: sku?.thumbnail_img || null,
            };
          }
        );

        // sort children alphabetically (optional)
        kids.sort((a, b) => a.name.localeCompare(b.name));

        return {
          _id: parent._id,
          name: parent.name,
          children: kids,
        };
      })
      // optional: only include parents that actually have children
      .filter((p) => p.children.length > 0)
      // optional: sort parents alphabetically
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.json(result);
  } catch (err) {
    console.error("getHomeCategories error", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ======================= CUSTOMER PRODUCT ======================= */
const getAllProducts = async (req, res) => {
  try {
    const { categoryId, sellerId } = req.query;

    let categoryIds = [];
    if (categoryId) {
      // find the target category
      const cat = await Category.findById(categoryId).lean();
      if (!cat) return res.status(404).json({ message: "Category not found" });

      // if root category (level == self) → include children too
      categoryIds = [cat._id];
      if (String(cat.level) === String(cat._id)) {
        const children = await Category.find(
          { level: cat._id, _id: { $ne: cat._id } },
          { _id: 1 }
        ).lean();
        categoryIds.push(...children.map((c) => c._id));
      }
    }

    // fetch only active products
    const query = { status: 1 };
    if (categoryIds.length) query.category_id = { $in: categoryIds };

    const products = await Product.find(query)
      .populate("category_id", "name")
      .lean();

    const productIds = products.map((p) => p._id);

    // fetch SKUs
    const skus = await ProductSku.find({
      product_id: { $in: productIds },
    })
      .select("_id product_id MRP SP thumbnail_img status createdAt")
      .sort({ createdAt: 1 }) // oldest first
      .lean();

    // pick first ACTIVE sku per product
    const firstActiveSkuMap = {};
    skus.forEach((sku) => {
      const pid = sku.product_id.toString();
      if (!firstActiveSkuMap[pid] && sku.status === 1) {
        firstActiveSkuMap[pid] = sku;
      }
    });

    // build final result (removed product_id & category_id)
    const result = products
      .map((p) => {
        const sku = firstActiveSkuMap[p._id.toString()];
        if (!sku) return null; // exclude products without active sku
        return {
          name: p.name,
          category_name: p.category_id?.name || null,
          sku_id: sku._id,
          thumbnail_img: sku.thumbnail_img,
          mrp: sku.MRP,
          selling_price: sku.SP,
          visitUrl: `/product/${sku._id}`,
        };
      })
      .filter(Boolean);

    return res.json(result);
  } catch (err) {
    console.error("getAllProducts error", err);
    return res.status(500).json({ message: err.message });
  }
};
const getProductBySkuId = async (req, res) => {
  try {
    const { skuId } = req.params;
    const sku = await ProductSku.findById(skuId)
      .select("-__v -updatedAt")
      .lean();
    if (!sku) return res.status(404).json({ message: "SKU not found" });

    const product = await Product.findById(sku.product_id)
      .populate("category_id", "name")
      .populate("brandId", "name") 
      .populate("userId", "full_name") 
      .select("-__v -createdAt -updatedAt")
      .lean();
    if (!product)
      return res.status(404).json({ message: "Parent product not found" });

    const variants = await Variant.find({
      category_id: product.category_id,
    }).lean();
    const variantMap = {};
    variants.forEach((v) => {
      variantMap[v._id.toString()] = v.name;
    });

    const allSkus = await ProductSku.find({ product_id: sku.product_id })
      .select("-__v -updatedAt -product_id")
      .lean();

    const transform = (s) => {
      const vv = {};
      for (const [k, v] of Object.entries(s.variant_values || {})) {
        vv[variantMap[k] || k] = v;
      }
      const left_stock = (s.initial_stock || 0) - (s.sold_stock || 0);
      return {
        _id: s._id,
        variant_values: vv,
        initial_stock: s.initial_stock,
        sold_stock: s.sold_stock,
        left_stock,
        thumbnail_img: s.thumbnail_img,
        side_imgs: s.side_imgs,
        status: s.status,
        // prices
        seller_mrp: s.seller_mrp ?? null,
        seller_sp: s.seller_sp ?? null,
        MRP: s.MRP ?? null,
        SP: s.SP ?? null,
        createdAt: s.createdAt,
      };
    };

    const main_sku = transform(sku);
    const other_skus = allSkus
      .filter((s) => String(s._id) !== String(sku._id))
      .map(transform);

    // ✅ NEW: normalize product.details -> product_details for FE
    const product_details = Array.isArray(product.details)
      ? product.details
          .filter((d) => d?.key && d?.value)
          .map((d) => ({
            key: String(d.key),
            value: String(d.value),
          }))
      : [];

    // brand (skip "other"/"others")
    let brand_name = null;
    if (product.brandId?.name) {
      const brand = String(product.brandId.name).trim().toLowerCase();
      if (brand !== "other" && brand !== "others") {
        brand_name = product.brandId.name;
      }
    }

    return res.json({
      product_id: product._id,
      product_name: product.name,
      product_description: product.description,
      product_status: product.status,
      category_id: product.category_id?._id || null,
      category_name: product.category_id?.name || null,
      brand_name,
      seller_name: product.userId?.full_name || null,
      product_details,
      main_sku,
      other_skus,
    });
  } catch (err) {
    console.error("getProductBySkuId error", err);
    return res.status(500).json({ message: err.message });
  }
};

const getAllFeaturedProducts = async (req, res) => {
  try {
    const { categoryId, productId } = req.body;

    let categoryIds = [];
    if (categoryId) {
      // find the target category
      const cat = await Category.findById(categoryId).lean();
      if (!cat) return res.status(404).json({ message: "Category not found" });

      // if root category (level == self) → include children too
      categoryIds = [cat._id];
      if (String(cat.level) === String(cat._id)) {
        const children = await Category.find(
          { level: cat._id, _id: { $ne: cat._id } },
          { _id: 1 }
        ).lean();
        categoryIds.push(...children.map((c) => c._id));
      }
    }

    // fetch only active products
    const query = { status: 1 };
    if (categoryIds.length) query.category_id = { $in: categoryIds };

    const products = await Product.find(query)
      .populate("category_id", "name")
      .lean();

    const productIds = products.map((p) => p._id);

    // fetch SKUs
    const skus = await ProductSku.find({
      product_id: { $in: productIds },
    })
      .select("_id product_id MRP SP thumbnail_img status createdAt")
      .sort({ createdAt: 1 }) // oldest first
      .lean();

    // pick first ACTIVE sku per product
    const firstActiveSkuMap = {};
    skus.forEach((sku) => {
      const pid = sku.product_id.toString();
      if (!firstActiveSkuMap[pid] && sku.status === 1) {
        firstActiveSkuMap[pid] = sku;
      }
    });

    // build final result
    const result = products
      .filter((p) => String(p._id) !== String(productId)) // 🚨 exclude main product
      .map((p) => {
        const sku = firstActiveSkuMap[p._id.toString()];
        if (!sku) return null; // exclude products without active sku
        return {
          name: p.name,
          category_name: p.category_id?.name || null,
          sku_id: sku._id,
          thumbnail_img: sku.thumbnail_img,
          mrp: sku.MRP,
          selling_price: sku.SP,
          visitUrl: `/product/${sku._id}`,
        };
      })
      .filter(Boolean);

    return res.json(result);
  } catch (err) {
    console.error("getAllFeaturedProducts error", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ======================= SELLER PRODUCT ======================= */
async function resolveVariantNames(categoryId, variantValues) {
  const variants = await Variant.find({ category_id: categoryId })
    .select("_id name")
    .lean();

  const mapById = new Map(variants.map((v) => [String(v._id), v.name]));
  const out = {};
  for (const [k, v] of Object.entries(variantValues || {})) {
    out[mapById.get(String(k)) || k] = v;
  }
  return out;
}

const getAllProductsBySeller = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const sellerId = req.user.userId;

    // --- category filter (root includes children)
    let categoryIds = [];
    if (categoryId) {
      const cat = await Category.findById(categoryId).lean();
      if (!cat) return res.status(404).json({ message: "Category not found" });

      categoryIds = [cat._id];
      // root → include direct children
      if (String(cat.level) === String(cat._id)) {
        const children = await Category.find(
          { level: cat._id, _id: { $ne: cat._id } },
          { _id: 1 }
        ).lean();
        categoryIds.push(...children.map((c) => c._id));
      }
    }

    // --- products owned by seller
    const query = { status: 1, userId: sellerId };
    if (categoryIds.length) query.category_id = { $in: categoryIds };

    const products = await Product.find(query)
      .populate("category_id", "name")
      .select("_id name category_id createdAt")
      .lean();

    if (!products.length) return res.json([]);

    const productIds = products.map((p) => p._id);

    // 1) include stock fields in the find() selection
    const skus = await ProductSku.find({ product_id: { $in: productIds } })
      .select(
        "_id product_id seller_mrp seller_sp variant_values thumbnail_img status createdAt initial_stock sold_stock"
      )
      .lean();

    // 2) Precompute product-level totals across all active SKUs
    const totalsByPid = new Map(); // pid -> { left: number, sold: number }
    for (const s of skus) {
      if (s.status !== 1) continue;
      const pid = String(s.product_id);
      const t = totalsByPid.get(pid) || { left: 0, sold: 0 };

      const left =
        typeof s.total_left_stock === "number" ? s.total_left_stock : 0;
      const sold =
        typeof s.total_sold_stock === "number" ? s.total_sold_stock : 0;

      t.left += Math.max(0, left);
      t.sold += Math.max(0, sold);
      totalsByPid.set(pid, t);
    }

    // 3) Latest active SKU per product (unchanged)
    const latestActiveSkuMap = new Map();
    for (const sku of skus) {
      if (sku.status !== 1) continue;
      const pid = String(sku.product_id);
      const current = latestActiveSkuMap.get(pid);
      if (!current || new Date(sku.createdAt) > new Date(current.createdAt)) {
        latestActiveSkuMap.set(pid, sku);
      }
    }

    // 4) Build rows
    const rows = [];
    for (const p of products) {
      const sku = latestActiveSkuMap.get(String(p._id));
      if (!sku) continue;

      const preview_variants = await resolveVariantNames(
        p.category_id?._id || p.category_id,
        sku.variant_values || {}
      );

      rows.push({
        name: p.name,
        category_name: p.category_id?.name || null,
        sku_id: sku._id,
        thumbnail_img: sku.thumbnail_img || null,

        preview_variants,
        product_created_at: p.createdAt,
        sku_created_at: sku.createdAt,
      });
    }

    // sort unchanged...
    rows.sort((a, b) => {
      const ta = new Date(
        a.product_created_at ?? a.sku_created_at ?? 0
      ).getTime();
      const tb = new Date(
        b.product_created_at ?? b.sku_created_at ?? 0
      ).getTime();
      return tb - ta;
    });
    console.log("rows::", rows);

    return res.json(rows);
  } catch (err) {
    console.error("getAllProductsBySeller error", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ======================= ADMIN PRODUCT ======================= */
const getAllProductsByAdmin = async (req, res) => {
  try {
    const { categoryId } = req.query;

    // --- category filter (root includes children)
    let categoryIds = [];
    if (categoryId) {
      const cat = await Category.findById(categoryId).lean();
      if (!cat) return res.status(404).json({ message: "Category not found" });

      categoryIds = [cat._id];
      // root → include direct children
      if (String(cat.level) === String(cat._id)) {
        const children = await Category.find(
          { level: cat._id, _id: { $ne: cat._id } },
          { _id: 1 }
        ).lean();
        categoryIds.push(...children.map((c) => c._id));
      }
    }

    // --- all active products (regardless of seller)
    const query = { status: 1 };
    if (categoryIds.length) query.category_id = { $in: categoryIds };

    const products = await Product.find(query)
      .populate("category_id", "name")
      .populate("userId", "full_name email phone_number") // ✅ seller info
      .select("_id name category_id userId createdAt")
      .lean();

    if (!products.length) return res.json([]);

    const productIds = products.map((p) => p._id);

    // --- get SKUs for all products
    const skus = await ProductSku.find({ product_id: { $in: productIds } })
      .select(
        "_id product_id seller_mrp seller_sp variant_values thumbnail_img status createdAt initial_stock sold_stock"
      )
      .lean();

    // --- latest active SKU per product
    const latestActiveSkuMap = new Map();
    for (const sku of skus) {
      if (sku.status !== 1) continue;
      const pid = String(sku.product_id);
      const current = latestActiveSkuMap.get(pid);
      if (!current || new Date(sku.createdAt) > new Date(current.createdAt)) {
        latestActiveSkuMap.set(pid, sku);
      }
    }

    // --- Build rows
    const rows = [];
    for (const p of products) {
      const sku = latestActiveSkuMap.get(String(p._id));
      if (!sku) continue;

      const preview_variants = await resolveVariantNames(
        p.category_id?._id || p.category_id,
        sku.variant_values || {}
      );

      rows.push({
        name: p.name,
        category_name: p.category_id?.name || null,
        seller: p.userId
          ? {
              id: p.userId._id,
              name: p.userId.full_name,
              email: p.userId.email,
              phone: p.userId.phone_number,
            }
          : null,
        sku_id: sku._id,
        thumbnail_img: sku.thumbnail_img || null,
        preview_variants,
        product_created_at: p.createdAt,
        sku_created_at: sku.createdAt,

        // seller-provided prices
        seller_mrp: sku.seller_mrp,
        seller_sp: sku.seller_sp,

        // stock
        initial_stock: sku.initial_stock,
        sold_stock: sku.sold_stock,
      });
    }

    // --- sort newest first
    rows.sort((a, b) => {
      const ta = new Date(a.product_created_at ?? a.sku_created_at ?? 0).getTime();
      const tb = new Date(b.product_created_at ?? b.sku_created_at ?? 0).getTime();
      return tb - ta;
    });

    return res.json(rows);
  } catch (err) {
    console.error("getAllProductsByAdmin error", err);
    return res.status(500).json({ message: err.message });
  }
};



module.exports = {
  createProduct,
  getAllProducts,
  getProductBySkuId,
  getAllProductsBySeller,
  getAllProductsByAdmin,
  getHomeCategories,
  getAllFeaturedProducts
};
