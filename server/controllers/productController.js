const {
  Category,
  Brand,
  Product,
  Variant,
  ProductSku,
} = require("../models/productModels");
const mongoose = require("mongoose");

/* ======================= CATEGORY ======================= */
const createCategory = async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (parentId) {
      // child category -> level = parentId (must exist)
      const parent = await Category.findById(parentId);
      if (!parent)
        return res.status(400).json({ message: "Parent category not found" });
      const cat = await Category.create({ name, level: parentId });
      return res.status(201).json(cat);
    } else {
      // root category -> level = self id
      const cat = new Category({ name });
      cat.level = cat._id;
      await cat.save();
      return res.status(201).json(cat);
    }
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

const getCategories = async (_req, res) => {
  try {
    // fetch only what we need
    const all = await Category.find({}, { _id: 1, name: 1, level: 1 }).lean();

    // map of children lists keyed by parentId (init empty arrays)
    const childrenMap = new Map(all.map((c) => [String(c._id), []]));

    // fill children for non-root nodes (root: level === _id)
    for (const c of all) {
      const parentId = String(c.level);
      const selfId = String(c._id);
      if (parentId !== selfId) {
        (childrenMap.get(parentId) || []).push(c);
      }
    }

    // build only roots with their direct children
    const roots = all.filter((c) => String(c.level) === String(c._id));

    // sort roots and children alphabetically (optional)
    roots.sort((a, b) => a.name.localeCompare(b.name));
    for (const [pid, arr] of childrenMap) {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }

    const result = roots.map((root) => ({
      _id: root._id,
      name: root.name,
      children: (childrenMap.get(String(root._id)) || []).map((ch) => ({
        _id: ch._id,
        name: ch.name,
      })),
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ======================= BRAND ======================= */
const createBrand = async (req, res) => {
  try {
    let { categoryId, name } = req.body;

    if (!categoryId || !name) {
      return res
        .status(400)
        .json({ message: "categoryId and name are required" });
    }

    const cat = await Category.findById(categoryId).select("_id");
    if (!cat) return res.status(404).json({ error: "Category not found" });

    const brand = await Brand.create({
      category_id: categoryId,
      name: name.trim(),
    });
    return res.status(201).json(brand);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

const getBrands = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }

    const brands = await Brand.find(
      { category_id: categoryId },
      { _id: 1, name: 1, values: 1 } // only select required fields
    ).lean();

    // format response
    const result = brands.map((v) => ({
      brandId: v._id,
      name: v.name,
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ======================= VARIANT ======================= */
const createVariant = async (req, res) => {
  try {
    const { categoryId, name, values } = req.body;

    if (!categoryId || !name) {
      return res
        .status(400)
        .json({ message: "categoryId and name are required" });
    }

    const category = await Category.findById(categoryId);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const variant = await Variant.create({
      category_id: category._id,
      name: name.toLowerCase(),
      values,
    });

    return res.status(201).json(variant);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

const getVariants = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }

    const variants = await Variant.find(
      { category_id: categoryId },
      { _id: 1, name: 1, values: 1 } // only select required fields
    ).lean();

    // format response
    const result = variants.map((v) => ({
      variantId: v._id,
      name: v.name,
      values: v.values,
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ======================= PRODUCT ======================= */
const createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { categoryId, name, description, variantRows } = req.body;

    if (!categoryId || !name || !variantRows || variantRows.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const userId = req.user.userId;

    // Step 1: Create Product
    const product = new Product({
      category_id: categoryId,
      name,
      description,
      status: 1,
      userId,
    });

    await product.save({ session });

    // Step 2: Create SKUs
    const skuDocs = variantRows.map((v) => ({
      product_id: product._id,
      variant_values: v.values, // expects object like {color: 'red', size: 'L'}
      initial_stock: v.totalStock,
      MRP: v.MRP,
      SP: v.SP,
      thumbnail_img: v.thumbnail_img,
      side_imgs: v.side_imgs || [],
      status: 1,
    }));

    await ProductSku.insertMany(skuDocs, { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Product Successfully Added",
    });
  } catch (error) {
    // Rollback transaction
    await session.abortTransaction();
    session.endSession();
    console.error("createProduct Error", error);
    return res.status(500).json({ error: error });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { categoryId } = req.query;

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

    // ✅ fetch only active products
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

    // 1. Find the requested SKU
    const sku = await ProductSku.findById(skuId)
      .select("-__v -createdAt -updatedAt")
      .lean();
    if (!sku) {
      return res.status(404).json({ message: "SKU not found" });
    }

    // 2. Find its parent Product
    const product = await Product.findById(sku.product_id)
      .populate("category_id", "name")
      .select("-__v -createdAt -updatedAt")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Parent product not found" });
    }

    // 3. Fetch variants for this category
    const variants = await Variant.find({
      category_id: product.category_id,
    }).lean();
    const variantMap = {};
    variants.forEach((v) => {
      variantMap[v._id.toString()] = v.name; // {variantId: "Color"}
    });

    // 4. Get all SKUs for same product
    const allSkus = await ProductSku.find({ product_id: sku.product_id })
      .select("-__v -createdAt -updatedAt -product_id")
      .lean();

    // helper: convert variant_values {variantId: value} → {variantName: value}
    const transformVariants = (skuDoc) => {
      const { product_id, initial_stock, sold_stock, ...rest } = skuDoc; // strip product_id, initial_stock, sold_stock
      const newVariants = {};
      for (const [vId, val] of Object.entries(skuDoc.variant_values || {})) {
        const variantName = variantMap[vId] || vId;
        newVariants[variantName] = val;
      }
      return {
        ...rest,
        variant_values: newVariants,
        left_stock: (initial_stock || 0) - (sold_stock || 0),
      };
    };

    // Transform requested sku + other skus
    const main_sku = transformVariants(sku);
    const other_skus = allSkus
      .filter((s) => String(s._id) !== String(sku._id))
      .map(transformVariants);

    // 5. Final response
    const result = {
      product_id: product._id,
      product_name: product.name,
      product_description: product.description,
      product_status: product.status,
      category_id: product.category_id?._id || null,
      category_name: product.category_id?.name || null,
      main_sku,
      other_skus,
    };

    return res.json(result);
  } catch (err) {
    console.error("getProductBySku error", err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createCategory,
  getCategories,
  createBrand,
  getBrands,
  createVariant,
  getVariants,
  createProduct,
  getAllProducts,
  getProductBySkuId,
};
