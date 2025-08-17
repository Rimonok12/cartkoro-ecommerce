const { Category, Product, Variant, ProductSku } = require('../models/productModels');
const mongoose = require("mongoose");


/* ======================= CATEGORY ======================= */
const createCategory = async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (parentId) {
      // child category -> level = parentId (must exist)
      const parent = await Category.findById(parentId);
      if (!parent) return res.status(400).json({ message: 'Parent category not found' });
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
    const childrenMap = new Map(all.map(c => [String(c._id), []]));

    // fill children for non-root nodes (root: level === _id)
    for (const c of all) {
      const parentId = String(c.level);
      const selfId   = String(c._id);
      if (parentId !== selfId) {
        (childrenMap.get(parentId) || []).push(c);
      }
    }

    // build only roots with their direct children
    const roots = all.filter(c => String(c.level) === String(c._id));

    // sort roots and children alphabetically (optional)
    roots.sort((a, b) => a.name.localeCompare(b.name));
    for (const [pid, arr] of childrenMap) {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }

    const result = roots.map(root => ({
      _id: root._id,
      name: root.name,
      children: (childrenMap.get(String(root._id)) || []).map(ch => ({
        _id: ch._id,
        name: ch.name
      }))
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
      return res.status(400).json({ message: 'categoryId and name are required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const variant = await Variant.create({
      category_id: category._id,
      name: name.toLowerCase(),
      values
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
      return res.status(400).json({ message: 'categoryId is required' });
    }

    const variants = await Variant.find(
      { category_id: categoryId },
      { _id: 1, name: 1, values: 1 }  // only select required fields
    ).lean();

    // format response
    const result = variants.map(v => ({
      variantId: v._id,
      name: v.name,
      values: v.values
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


/* ======================= PRODUCT ======================= */
const createProduct = async (req, res) => {
  try {
    const { categoryId, 
      name, 
      description, 
      MRP, 
      SP, 
      thumbnail_url, 
      thumbnail_img,
      side_imgs,
      variants,
      totalStock 
    } = req.body;

    const product = await Product.create({
      category_id: categoryId,
      name,
      description,
      status: 1
    });

    const productSkus = await ProductSku.create({
      product_id: product._id,
      variant_values:variants,
      initial_stock:totalStock,
      sold_stock:0,
      MRP:MRP,
      SP:SP,
      thumbnail_img:thumbnail_img,
      side_imgs:side_imgs,
      status: 1
    });

    return res.status(201).json({message:"Product Successfully Added"});
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// const createProduct = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { name, description, price, categoryId, hasVariants, variants } = req.body;

//     // Step 1: Create Product
//     const product = new Product({
//       name,
//       description,
//       price,
//       categoryId,
//       hasVariants
//     });

//     await product.save({ session });

//     // Step 2: If has variants, create SKUs
//     if (hasVariants && variants?.length > 0) {
//       const skuDocs = variants.map(v => ({
//         productId: product._id,
//         categoryId,
//         name: v.name,
//         price: v.price,
//         stock: v.stock
//       }));

//       await ProductSku.insertMany(skuDocs, { session });
//     }

//     // ✅ Commit transaction
//     await session.commitTransaction();
//     session.endSession();

//     return res.status(201).json({ success: true, product });

//   } catch (error) {
//     // ❌ Rollback transaction
//     await session.abortTransaction();
//     session.endSession();

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create product with variants",
//       error: error.message
//     });
//   }
// };



const getAllProducts = async (req, res) => {
  try {
    const { categoryId } = req.query;

    if (!categoryId) {
      const products = await Product.find().populate('category', 'name');
      return res.json(products);
    }

    // find the target category
    const cat = await Category.findById(categoryId).lean();
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    // root if level == self → include all children whose level == rootId
    let categoryIds = [cat._id];
    if (String(cat.level) === String(cat._id)) {
      const children = await Category.find({ level: cat._id, _id: { $ne: cat._id } }, { _id: 1 }).lean();
      categoryIds = [cat._id, ...children.map(c => c._id)];
    }

    const products = await Product.find({ category: { $in: categoryIds } })
      .populate('category', 'name');
    return res.json(products);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};


module.exports = {
  createCategory,
  getCategories,
  createVariant,
  getVariants,
  createProduct,
  getAllProducts
};